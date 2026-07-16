'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface Flight {
    id: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
    availableSeats: number;
    duration?: number;
    status: string;
    airlineId: string;
    airplaneId: string;
    departureAirportId: string;
    arrivalAirportId: string;
    airline?: { name: string; code: string };
    airplane?: { model: string; capacity: number };
    departureAirport?: { iataCode: string; city: string };
    arrivalAirport?: { iataCode: string; city: string };
}

interface SelectorOption {
    id: string;
    name: string;
    code?: string;
    city?: string;
    iataCode?: string;
    model?: string;
}

function FlightsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);

    // Options for forms
    const [airlines, setAirlines] = useState<SelectorOption[]>([]);
    const [airplanes, setAirplanes] = useState<SelectorOption[]>([]);
    const [airports, setAirports] = useState<SelectorOption[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

    const [form, setForm] = useState({
        flightNumber: '',
        airlineId: '',
        airplaneId: '',
        departureAirportId: '',
        arrivalAirportId: '',
        departureTime: '',
        arrivalTime: '',
        price: '',
        duration: '',
        status: 'SCHEDULED',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/flights');
            } else if (!['admin', 'staff'].includes(user.role)) {
                toast.error('Anda tidak memiliki akses ke halaman ini');
                router.push('/');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin', 'staff'].includes(user.role)) {
            loadFlights();
            if (user.role === 'admin') {
                loadSelectors();
            }
        }
    }, [user]);

    const loadFlights = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/flights/list');
            if (response.ok) {
                const data = await response.json();
                setFlights(data.flights || []);
            } else {
                toast.error('Gagal mengambil data penerbangan');
            }
        } catch (error) {
            console.error('Error loading flights:', error);
            toast.error('Gagal memuat data penerbangan');
        } finally {
            setLoading(false);
        }
    };

    const loadSelectors = async () => {
        try {
            // Load Airlines
            const airlineRes = await fetch('/api/admin/airlines');
            if (airlineRes.ok) {
                const data = await airlineRes.json();
                setAirlines(data.airlines || []);
            }

            // Load Airplanes
            const airplaneRes = await fetch('/api/admin/airplanes');
            if (airplaneRes.ok) {
                const data = await airplaneRes.json();
                setAirplanes(data.airplanes || []);
            }

            // Load Airports
            const airportRes = await fetch('/api/admin/airports');
            if (airportRes.ok) {
                const data = await airportRes.json();
                setAirports(data.airports || []);
            }
        } catch (error) {
            console.error('Error loading selector options:', error);
        }
    };

    const formatLocalDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleOpenCreate = () => {
        setForm({
            flightNumber: '',
            airlineId: airlines[0]?.id || '',
            airplaneId: airplanes[0]?.id || '',
            departureAirportId: airports[0]?.id || '',
            arrivalAirportId: airports[1]?.id || '',
            departureTime: '',
            arrivalTime: '',
            price: '',
            duration: '120',
            status: 'SCHEDULED',
        });
        setIsEditing(false);
        setSelectedFlightId(null);
        setShowModal(true);
    };

    const handleOpenEdit = (flight: Flight) => {
        setForm({
            flightNumber: flight.flightNumber,
            airlineId: flight.airlineId,
            airplaneId: flight.airplaneId,
            departureAirportId: flight.departureAirportId,
            arrivalAirportId: flight.arrivalAirportId,
            departureTime: formatLocalDateTime(flight.departureTime),
            arrivalTime: formatLocalDateTime(flight.arrivalTime),
            price: parseFloat(flight.price).toString(),
            duration: flight.duration ? flight.duration.toString() : '120',
            status: flight.status,
        });
        setIsEditing(true);
        setSelectedFlightId(flight.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.departureAirportId === form.arrivalAirportId) {
            toast.error('Bandara asal dan tujuan tidak boleh sama');
            return;
        }

        const priceVal = parseFloat(form.price);
        if (isNaN(priceVal) || priceVal <= 0) {
            toast.error('Harga harus berupa angka positif');
            return;
        }

        const depDate = new Date(form.departureTime);
        const arrDate = new Date(form.arrivalTime);

        if (depDate >= arrDate) {
            toast.error('Waktu tiba harus setelah waktu keberangkatan');
            return;
        }

        const endpoint = isEditing ? `/api/admin/flights/${selectedFlightId}` : '/api/admin/flights';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditing ? 'Penerbangan berhasil diperbarui' : 'Jadwal penerbangan berhasil dibuat');
                setShowModal(false);
                loadFlights();
            } else {
                toast.error(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id: string, flightNumber: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus penerbangan ${flightNumber}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/flights/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Penerbangan berhasil dihapus');
                loadFlights();
            } else {
                toast.error(data.error || 'Gagal menghapus penerbangan');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60 animate-pulse font-medium">Loading...</p>
            </div>
        );
    }

    if (!user || !['admin', 'staff'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Back Link */}
                    <Link href="/admin/dashboard" className="text-sky-600 hover:text-sky-700 mb-6 inline-flex items-center gap-2 font-medium">
                        ← Kembali ke Dashboard
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-2">
                                Manajemen <span className="gradient-text">Penerbangan</span>
                            </h1>
                            <p className="text-foreground/60">CRUD jadwal rute penerbangan aktif</p>
                        </div>
                        {user.role === 'admin' && (
                            <button onClick={handleOpenCreate} className="glass-button px-6 py-3 font-semibold shadow-glow text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-all">
                                + Tambah Penerbangan
                            </button>
                        )}
                    </div>

                    {/* Flights Table */}
                    <div className="glass-card rounded-3xl overflow-hidden shadow-glass">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 border-b border-white/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">No. Penerbangan</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Maskapai</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Rute (IATA)</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Keberangkatan / Tiba</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kapasitas Sisa</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Harga</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Status</th>
                                        {user.role === 'admin' && <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {flights.length === 0 ? (
                                        <tr>
                                            <td colSpan={user.role === 'admin' ? 8 : 7} className="px-6 py-12 text-center text-foreground/50">
                                                Belum ada data penerbangan.
                                            </td>
                                        </tr>
                                    ) : (
                                        flights.map((flight) => (
                                            <tr key={flight.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{flight.flightNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold">{flight.airline?.name || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-sky-700">{flight.departureAirport?.iataCode}</span>
                                                    <span className="text-foreground/40 mx-1.5">→</span>
                                                    <span className="font-bold text-cyan-600">{flight.arrivalAirport?.iataCode}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs space-y-1">
                                                    <div>🛫 {new Date(flight.departureTime).toLocaleDateString('id-ID', { dateStyle: 'short' })} {new Date(flight.departureTime).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</div>
                                                    <div>🛬 {new Date(flight.arrivalTime).toLocaleDateString('id-ID', { dateStyle: 'short' })} {new Date(flight.arrivalTime).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold">
                                                    {flight.availableSeats} / {flight.airplane?.capacity || 0} Kursi
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-emerald-600">
                                                    Rp {parseFloat(flight.price).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        flight.status.toUpperCase() === 'SCHEDULED'
                                                            ? 'bg-emerald-500/20 text-emerald-600'
                                                            : 'bg-red-500/20 text-red-600'
                                                    }`}>
                                                        {flight.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                {user.role === 'admin' && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => handleOpenEdit(flight)} className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-700 transition-all font-semibold">
                                                                ✏️ Edit
                                                            </button>
                                                            <button onClick={() => handleDelete(flight.id, flight.flightNumber)} className="text-xs px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-700 transition-all font-semibold">
                                                                🗑️ Hapus
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="glass-card max-w-xl w-full p-8 rounded-3xl animate-scale-in relative border border-white/60">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-2xl text-foreground/60 hover:text-foreground">
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 gradient-text">
                            {isEditing ? 'Edit Jadwal Penerbangan' : 'Buat Penerbangan Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Nomor Penerbangan</label>
                                    <input
                                        type="text"
                                        placeholder="GA101"
                                        value={form.flightNumber}
                                        onChange={(e) => setForm({ ...form, flightNumber: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-mono font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Maskapai</label>
                                    <select
                                        value={form.airlineId}
                                        onChange={(e) => setForm({ ...form, airlineId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                        required
                                    >
                                        <option value="">-- Pilih Maskapai --</option>
                                        {airlines.map((a) => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Pesawat (Armada)</label>
                                    <select
                                        value={form.airplaneId}
                                        onChange={(e) => setForm({ ...form, airplaneId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                        required
                                    >
                                        <option value="">-- Pilih Pesawat --</option>
                                        {airplanes.map((ap) => (
                                            <option key={ap.id} value={ap.id}>{ap.model} ({ap.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Status Penerbangan</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                    >
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Bandara Asal (From)</label>
                                    <select
                                        value={form.departureAirportId}
                                        onChange={(e) => setForm({ ...form, departureAirportId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                        required
                                    >
                                        <option value="">-- Pilih Bandara Asal --</option>
                                        {airports.map((ap) => (
                                            <option key={ap.id} value={ap.id}>{ap.city} ({ap.iataCode})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Bandara Tujuan (To)</label>
                                    <select
                                        value={form.arrivalAirportId}
                                        onChange={(e) => setForm({ ...form, arrivalAirportId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                        required
                                    >
                                        <option value="">-- Pilih Bandara Tujuan --</option>
                                        {airports.map((ap) => (
                                            <option key={ap.id} value={ap.id}>{ap.city} ({ap.iataCode})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Waktu Keberangkatan</label>
                                    <input
                                        type="datetime-local"
                                        value={form.departureTime}
                                        onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Waktu Tiba</label>
                                    <input
                                        type="datetime-local"
                                        value={form.arrivalTime}
                                        onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Harga Tiket Base (IDR)</label>
                                    <input
                                        type="number"
                                        placeholder="800000"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-emerald-600 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Durasi (Menit)</label>
                                    <input
                                        type="number"
                                        placeholder="120"
                                        value={form.duration}
                                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-foreground/10 font-semibold hover:bg-black/5 transition-all">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all shadow-glow">
                                    {isEditing ? 'Simpan Perubahan' : 'Buat Penerbangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}

export default function FlightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <FlightsContent />
        </Suspense>
    );
}
