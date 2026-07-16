'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

interface Airplane {
    id: string;
    model: string;
    registrationNumber?: string;
    capacity: number;
    airline: { name: string; code: string; logo?: string };
}

interface Seat {
    id: string;
    seatNumber: string;
    class: 'economy' | 'business' | 'first';
}

const CLASS_COLORS = {
    first: {
        bg: 'bg-amber-400',
        border: 'border-amber-500',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-700 border-amber-300',
        label: 'First Class',
        icon: '👑',
    },
    business: {
        bg: 'bg-violet-400',
        border: 'border-violet-500',
        text: 'text-violet-900',
        badge: 'bg-violet-100 text-violet-700 border-violet-300',
        label: 'Business',
        icon: '💼',
    },
    economy: {
        bg: 'bg-sky-400',
        border: 'border-sky-500',
        text: 'text-sky-900',
        badge: 'bg-sky-100 text-sky-700 border-sky-300',
        label: 'Economy',
        icon: '🪑',
    },
};

function SeatsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [airplanes, setAirplanes] = useState<Airplane[]>([]);
    const [selectedAirplane, setSelectedAirplane] = useState<Airplane | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loadingAirplanes, setLoadingAirplanes] = useState(true);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modals
    const [showAddSeat, setShowAddSeat] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [editSeat, setEditSeat] = useState<Seat | null>(null);

    // Add seat form
    const [addSeatNum, setAddSeatNum] = useState('');
    const [addSeatClass, setAddSeatClass] = useState<'economy' | 'business' | 'first'>('economy');

    // Edit seat
    const [editClass, setEditClass] = useState<'economy' | 'business' | 'first'>('economy');

    // Generate layout form
    const [genRows, setGenRows] = useState('30');
    const [genColumns, setGenColumns] = useState(['A', 'B', 'C', 'D', 'E', 'F']);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth/login?redirect=/admin/seats');
            } else if (!['admin'].includes(user.role)) {
                toast.error('Hanya Admin yang dapat mengelola kursi');
                router.push('/admin/dashboard');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user?.role === 'admin') {
            loadAirplanes();
        }
    }, [user]);

    const loadAirplanes = async () => {
        try {
            setLoadingAirplanes(true);
            const res = await fetch('/api/admin/airplanes');
            if (res.ok) {
                const data = await res.json();
                setAirplanes(data.airplanes || []);
            }
        } catch (err) {
            toast.error('Gagal memuat data pesawat');
        } finally {
            setLoadingAirplanes(false);
        }
    };

    const loadSeats = async (airplaneId: string) => {
        try {
            setLoadingSeats(true);
            const res = await fetch(`/api/admin/seats?airplaneId=${airplaneId}`);
            if (res.ok) {
                const data = await res.json();
                setSeats(data.seats || []);
            }
        } catch (err) {
            toast.error('Gagal memuat data kursi');
        } finally {
            setLoadingSeats(false);
        }
    };

    const handleSelectAirplane = (airplane: Airplane) => {
        setSelectedAirplane(airplane);
        loadSeats(airplane.id);
    };

    const handleAddSeat = async () => {
        if (!selectedAirplane || !addSeatNum.trim()) {
            toast.error('Nomor kursi tidak boleh kosong');
            return;
        }
        try {
            setSaving(true);
            const res = await fetch('/api/admin/seats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    airplaneId: selectedAirplane.id,
                    seatNumber: addSeatNum.trim().toUpperCase(),
                    seatClass: addSeatClass,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal menambah kursi');
            toast.success(`Kursi ${addSeatNum.toUpperCase()} berhasil ditambahkan`);
            setAddSeatNum('');
            setShowAddSeat(false);
            loadSeats(selectedAirplane.id);
            setAirplanes(prev =>
                prev.map(p => p.id === selectedAirplane.id ? { ...p, capacity: p.capacity + 1 } : p)
            );
            setSelectedAirplane(prev => prev ? { ...prev, capacity: prev.capacity + 1 } : prev);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditSeat = async () => {
        if (!editSeat) return;
        try {
            setSaving(true);
            const res = await fetch('/api/admin/seats', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editSeat.id, seatClass: editClass }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal mengubah kelas');
            toast.success(`Kelas kursi ${editSeat.seatNumber} diubah ke ${editClass}`);
            setEditSeat(null);
            if (selectedAirplane) loadSeats(selectedAirplane.id);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSeat = async (seat: Seat) => {
        if (!selectedAirplane) return;
        if (!confirm(`Hapus kursi ${seat.seatNumber}? Tindakan ini tidak bisa dibatalkan.`)) return;
        try {
            const res = await fetch(`/api/admin/seats?id=${seat.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal menghapus kursi');
            toast.success(`Kursi ${seat.seatNumber} dihapus`);
            loadSeats(selectedAirplane.id);
            setAirplanes(prev =>
                prev.map(p => p.id === selectedAirplane.id ? { ...p, capacity: Math.max(0, p.capacity - 1) } : p)
            );
            setSelectedAirplane(prev => prev ? { ...prev, capacity: Math.max(0, prev.capacity - 1) } : prev);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleGenerate = async () => {
        if (!selectedAirplane) return;
        const rowCount = parseInt(genRows, 10);
        if (isNaN(rowCount) || rowCount <= 0 || rowCount > 100) {
            toast.error('Jumlah baris harus antara 1–100');
            return;
        }
        if (genColumns.length === 0) {
            toast.error('Minimal satu kolom diperlukan');
            return;
        }
        try {
            setSaving(true);
            const res = await fetch('/api/admin/seats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    airplaneId: selectedAirplane.id,
                    rows: genRows,
                    columns: genColumns,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal generate kursi');
            toast.success(data.message || `${data.count} kursi berhasil dibuat`);
            setShowGenerateModal(false);
            loadSeats(selectedAirplane.id);
            // Reload airplanes to get updated capacity
            loadAirplanes();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Group seats by row for visual display
    const groupedSeats: Record<string, Seat[]> = {};
    seats.forEach(s => {
        const row = s.seatNumber.replace(/[^0-9]/g, '') || '?';
        if (!groupedSeats[row]) groupedSeats[row] = [];
        groupedSeats[row].push(s);
    });

    const sortedRows = Object.keys(groupedSeats).sort((a, b) => parseInt(a) - parseInt(b));

    const seatCounts = {
        first: seats.filter(s => s.class === 'first').length,
        business: seats.filter(s => s.class === 'business').length,
        economy: seats.filter(s => s.class === 'economy').length,
    };

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen sky-gradient pb-16">
            <Toaster />
            <Navbar />

            <div className="pt-24 px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-semibold mb-3">
                            💺 Master Data Kursi Pesawat
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                            Seat <span className="gradient-text">Layout Editor</span>
                        </h1>
                        <p className="text-foreground/60 text-lg">Kelola tata letak kursi (Economy, Business, First Class) per armada pesawat.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT: Airplane Selector */}
                        <div className="lg:col-span-1">
                            <div className="glass-card rounded-3xl border border-white/60 overflow-hidden">
                                <div className="p-6 bg-white/20 border-b border-white/30">
                                    <h2 className="text-lg font-bold">🛩️ Pilih Armada Pesawat</h2>
                                    <p className="text-xs text-foreground/60 mt-1">Klik untuk melihat layout kursi</p>
                                </div>

                                {loadingAirplanes ? (
                                    <div className="p-8 text-center text-foreground/50">Memuat armada...</div>
                                ) : airplanes.length === 0 ? (
                                    <div className="p-8 text-center text-foreground/50">Belum ada armada pesawat terdaftar.</div>
                                ) : (
                                    <div className="divide-y divide-white/10">
                                        {airplanes.map(plane => (
                                            <button
                                                key={plane.id}
                                                onClick={() => handleSelectAirplane(plane)}
                                                className={`w-full text-left px-5 py-4 transition-all hover:bg-white/30 ${
                                                    selectedAirplane?.id === plane.id
                                                        ? 'bg-indigo-500/20 border-l-4 border-indigo-500'
                                                        : 'border-l-4 border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {plane.airline.logo ? (
                                                        <img src={plane.airline.logo} alt={plane.airline.name} className="h-8 w-8 object-contain rounded-md bg-white p-0.5 border border-white/60" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-md bg-indigo-500/20 flex items-center justify-center text-sm">✈️</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-foreground truncate">{plane.model}</p>
                                                        <p className="text-xs text-foreground/60">{plane.airline.name} · {plane.registrationNumber || 'No Reg'}</p>
                                                    </div>
                                                    <span className="text-xs font-bold bg-white/40 px-2 py-1 rounded-lg text-indigo-600 border border-white/60 whitespace-nowrap">
                                                        {plane.capacity} kursi
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Seat Layout */}
                        <div className="lg:col-span-2">
                            {!selectedAirplane ? (
                                <div className="glass-card rounded-3xl border border-white/60 p-16 text-center">
                                    <div className="text-6xl mb-4">✈️</div>
                                    <h3 className="text-xl font-bold mb-2 text-foreground/70">Pilih Pesawat</h3>
                                    <p className="text-foreground/50">Pilih armada pesawat di panel kiri untuk melihat dan mengedit layout kursinya.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Airplane Info Header */}
                                    <div className="glass-card rounded-3xl border border-white/60 p-6 mb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-2xl font-extrabold tracking-tight">{selectedAirplane.model}</h2>
                                                <p className="text-sm text-foreground/60">{selectedAirplane.airline.name} · {selectedAirplane.registrationNumber || 'Tanpa Registrasi'}</p>
                                                <div className="flex gap-3 mt-3">
                                                    {(['first', 'business', 'economy'] as const).map(cls => (
                                                        <span key={cls} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${CLASS_COLORS[cls].badge}`}>
                                                            {CLASS_COLORS[cls].icon} {CLASS_COLORS[cls].label}: {seatCounts[cls]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => { setShowGenerateModal(true); }}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                                                >
                                                    ⚡ Generate Layout
                                                </button>
                                                <button
                                                    onClick={() => { setShowAddSeat(true); }}
                                                    className="glass-button px-4 py-2 text-sm font-bold transition-all"
                                                >
                                                    ＋ Tambah Kursi
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-3 mb-4 px-1">
                                        {(['first', 'business', 'economy'] as const).map(cls => (
                                            <div key={cls} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${CLASS_COLORS[cls].badge}`}>
                                                <div className={`w-3 h-3 rounded-sm ${CLASS_COLORS[cls].bg}`} />
                                                {CLASS_COLORS[cls].icon} {CLASS_COLORS[cls].label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Seat Grid */}
                                    <div className="glass-card rounded-3xl border border-white/60 overflow-hidden">
                                        <div className="p-5 bg-white/20 border-b border-white/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-sm font-bold">Layout Kursi Pesawat</span>
                                                <span className="text-xs text-foreground/60 ml-2">· {seats.length} Total Kursi</span>
                                            </div>
                                            {loadingSeats && (
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            )}
                                        </div>

                                        {loadingSeats ? (
                                            <div className="p-12 text-center text-foreground/50">Memuat kursi...</div>
                                        ) : seats.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <div className="text-5xl mb-3">🪑</div>
                                                <p className="text-foreground/60 font-medium mb-2">Belum ada kursi terdaftar</p>
                                                <p className="text-xs text-foreground/40">Gunakan tombol <strong>Generate Layout</strong> untuk membuat kursi otomatis,<br/>atau <strong>Tambah Kursi</strong> untuk menambah satu per satu.</p>
                                            </div>
                                        ) : (
                                            <div className="p-5 max-h-[600px] overflow-y-auto">
                                                {/* Cabin Nose indicator */}
                                                <div className="flex justify-center mb-6">
                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/10 border border-slate-300/40 text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                                        ▲ Hidung Pesawat (Depan)
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    {sortedRows.map(rowNum => {
                                                        const rowSeats = groupedSeats[rowNum];
                                                        // Sort by column letter within row
                                                        rowSeats.sort((a, b) => {
                                                            const colA = a.seatNumber.replace(/[0-9]/g, '');
                                                            const colB = b.seatNumber.replace(/[0-9]/g, '');
                                                            return colA.localeCompare(colB);
                                                        });

                                                        // Determine aisle position (after column C for 6-wide)
                                                        const columns = rowSeats.map(s => s.seatNumber.replace(/[0-9]/g, ''));
                                                        const aisleAfterIdx = columns.indexOf('D') - 1;

                                                        return (
                                                            <div key={rowNum} className="flex items-center gap-1">
                                                                {/* Row number */}
                                                                <span className="text-[10px] font-bold text-foreground/40 w-6 text-center flex-shrink-0">{rowNum}</span>

                                                                {rowSeats.map((seat, idx) => {
                                                                    const cls = seat.class;
                                                                    const col = seat.seatNumber.replace(/[0-9]/g, '');
                                                                    const isAisleGap = col === 'D';

                                                                    return (
                                                                        <div key={seat.id} className={`flex items-center ${isAisleGap ? 'ml-3' : ''}`}>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditSeat(seat);
                                                                                    setEditClass(seat.class);
                                                                                }}
                                                                                className={`
                                                                                    group relative w-9 h-9 rounded-md border-2 text-[9px] font-extrabold 
                                                                                    flex items-center justify-center transition-all duration-150
                                                                                    hover:scale-110 hover:shadow-md active:scale-95
                                                                                    ${CLASS_COLORS[cls].bg} ${CLASS_COLORS[cls].border} ${CLASS_COLORS[cls].text}
                                                                                `}
                                                                                title={`${seat.seatNumber} — ${CLASS_COLORS[cls].label} | Click to edit`}
                                                                            >
                                                                                {seat.seatNumber.replace(/[0-9]/g, '')}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex justify-center mt-6">
                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/10 border border-slate-300/40 text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                                        ▼ Ekor Pesawat (Belakang)
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== MODAL: Generate Layout ===== */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-3xl border border-white/60 shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-white/30">
                            <h3 className="text-xl font-extrabold">⚡ Generate Layout Kursi Otomatis</h3>
                            <p className="text-xs text-foreground/60 mt-1">Membuat semua kursi sekaligus berdasarkan baris & kolom. Layout lama akan dihapus.</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-wider">Jumlah Baris (Rows)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={genRows}
                                    onChange={e => setGenRows(e.target.value)}
                                    className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <p className="text-[10px] text-foreground/40 mt-1">Baris 1-2 → First Class · Baris 3-7 → Business · Sisanya → Economy</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-wider">Kolom (Columns)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(col => (
                                        <button
                                            key={col}
                                            onClick={() => {
                                                setGenColumns(prev =>
                                                    prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col].sort()
                                                );
                                            }}
                                            className={`w-10 h-10 rounded-lg border-2 text-sm font-extrabold transition-all ${
                                                genColumns.includes(col)
                                                    ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white/40 border-white/60 text-foreground/60 hover:bg-white/60'
                                            }`}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-foreground/40 mt-1">
                                    Total kursi: {parseInt(genRows || '0') * genColumns.length} kursi
                                </p>
                            </div>

                            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                                <p className="text-xs font-semibold text-amber-700">⚠️ Peringatan: Semua kursi lama pada pesawat ini akan dihapus dan diganti dengan layout baru.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/30 flex gap-3">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-white/60 hover:bg-white/40 font-semibold text-sm transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={saving || genColumns.length === 0}
                                className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {saving ? 'Membuat...' : `⚡ Generate ${parseInt(genRows || '0') * genColumns.length} Kursi`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL: Add Single Seat ===== */}
            {showAddSeat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-3xl border border-white/60 shadow-2xl w-full max-w-sm">
                        <div className="p-6 border-b border-white/30">
                            <h3 className="text-xl font-extrabold">＋ Tambah Kursi</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-wider">Nomor Kursi (e.g. 12A)</label>
                                <input
                                    type="text"
                                    value={addSeatNum}
                                    onChange={e => setAddSeatNum(e.target.value.toUpperCase())}
                                    placeholder="contoh: 12A"
                                    className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-wider">Kelas Kursi</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['economy', 'business', 'first'] as const).map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => setAddSeatClass(cls)}
                                            className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                                addSeatClass === cls
                                                    ? `${CLASS_COLORS[cls].bg} ${CLASS_COLORS[cls].border} ${CLASS_COLORS[cls].text}`
                                                    : 'bg-white/40 border-white/60 text-foreground/60 hover:bg-white/60'
                                            }`}
                                        >
                                            {CLASS_COLORS[cls].icon}<br />{CLASS_COLORS[cls].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/30 flex gap-3">
                            <button
                                onClick={() => setShowAddSeat(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-white/60 hover:bg-white/40 font-semibold text-sm transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddSeat}
                                disabled={saving || !addSeatNum.trim()}
                                className="flex-1 glass-button px-4 py-3 text-sm font-bold disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Tambah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL: Edit Seat Class ===== */}
            {editSeat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-3xl border border-white/60 shadow-2xl w-full max-w-sm">
                        <div className="p-6 border-b border-white/30">
                            <h3 className="text-xl font-extrabold">✏️ Edit Kursi {editSeat.seatNumber}</h3>
                            <p className="text-xs text-foreground/60 mt-1">Ubah kelas atau hapus kursi ini dari pesawat</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-wider">Kelas Kursi</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['economy', 'business', 'first'] as const).map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => setEditClass(cls)}
                                            className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                                editClass === cls
                                                    ? `${CLASS_COLORS[cls].bg} ${CLASS_COLORS[cls].border} ${CLASS_COLORS[cls].text}`
                                                    : 'bg-white/40 border-white/60 text-foreground/60 hover:bg-white/60'
                                            }`}
                                        >
                                            {CLASS_COLORS[cls].icon}<br />{CLASS_COLORS[cls].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/30 flex gap-3">
                            <button
                                onClick={() => handleDeleteSeat(editSeat)}
                                className="px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-200 font-bold text-sm transition-all"
                            >
                                🗑️ Hapus
                            </button>
                            <button
                                onClick={() => setEditSeat(null)}
                                className="flex-1 px-4 py-3 rounded-xl border border-white/60 hover:bg-white/40 font-semibold text-sm transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleEditSeat}
                                disabled={saving}
                                className="flex-1 glass-button px-4 py-3 text-sm font-bold disabled:opacity-50"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminSeatsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SeatsContent />
        </Suspense>
    );
}
