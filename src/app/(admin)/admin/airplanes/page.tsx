'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface Airplane {
    id: string;
    airlineId: string;
    model: string;
    registrationNumber?: string;
    capacity: number;
    description?: string;
    airline?: {
        name: string;
        code: string;
    };
}

interface AirlineOption {
    id: string;
    name: string;
    code: string;
}

function AirplanesContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [airplanes, setAirplanes] = useState<Airplane[]>([]);
    const [airlines, setAirlines] = useState<AirlineOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAirplaneId, setSelectedAirplaneId] = useState<string | null>(null);

    const [form, setForm] = useState({
        airlineId: '',
        model: '',
        capacity: '',
        registrationNumber: '',
        description: '',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/airplanes');
            } else if (user.role !== 'admin') {
                toast.error('Hanya admin yang memiliki akses ke halaman ini');
                router.push('/admin/dashboard');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin'].includes(user.role)) {
            loadAirplanes();
            loadAirlines();
        }
    }, [user]);

    const loadAirplanes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/airplanes');
            if (response.ok) {
                const data = await response.json();
                setAirplanes(data.airplanes || []);
            } else {
                toast.error('Gagal mengambil data pesawat');
            }
        } catch (error) {
            console.error('Error loading airplanes:', error);
            toast.error('Gagal memuat data pesawat');
        } finally {
            setLoading(false);
        }
    };

    const loadAirlines = async () => {
        try {
            const response = await fetch('/api/admin/airlines');
            if (response.ok) {
                const data = await response.json();
                setAirlines(data.airlines || []);
            }
        } catch (error) {
            console.error('Error loading airlines options:', error);
        }
    };

    const handleOpenCreate = () => {
        setForm({
            airlineId: airlines[0]?.id || '',
            model: '',
            capacity: '',
            registrationNumber: '',
            description: '',
        });
        setIsEditing(false);
        setSelectedAirplaneId(null);
        setShowModal(true);
    };

    const handleOpenEdit = (airplane: Airplane) => {
        setForm({
            airlineId: airplane.airlineId,
            model: airplane.model,
            capacity: airplane.capacity.toString(),
            registrationNumber: airplane.registrationNumber || '',
            description: airplane.description || '',
        });
        setIsEditing(true);
        setSelectedAirplaneId(airplane.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.airlineId) {
            toast.error('Pilih maskapai pemilik pesawat');
            return;
        }

        const capVal = parseInt(form.capacity, 10);
        if (isNaN(capVal) || capVal <= 0) {
            toast.error('Kapasitas harus berupa angka positif');
            return;
        }

        const endpoint = isEditing ? `/api/admin/airplanes/${selectedAirplaneId}` : '/api/admin/airplanes';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditing ? 'Pesawat berhasil diperbarui' : 'Pesawat berhasil ditambahkan beserta denah kursi');
                setShowModal(false);
                loadAirplanes();
            } else {
                toast.error(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id: string, model: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pesawat ${model}? Penghapusan ini akan menghapus seluruh data kursi pesawat.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/airplanes/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Pesawat berhasil dihapus');
                loadAirplanes();
            } else {
                toast.error(data.error || 'Gagal menghapus pesawat');
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

    if (!user || !['admin'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <AdminNavbar />
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
                                Manajemen <span className="gradient-text">Armada Pesawat</span>
                            </h1>
                            <p className="text-foreground/60">Kelola master data pesawat dan alokasi kapasitas kursi</p>
                        </div>
                        <button onClick={handleOpenCreate} className="glass-button px-6 py-3 font-semibold shadow-glow text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-all">
                            + Tambah Pesawat
                        </button>
                    </div>

                    {/* Airplanes Table */}
                    <div className="glass-card rounded-3xl overflow-hidden shadow-glass">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 border-b border-white/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">No. Registrasi</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Model Pesawat</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Maskapai</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kapasitas Kursi</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Keterangan</th>
                                        <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {airplanes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                                                Belum ada data pesawat yang terdaftar.
                                            </td>
                                        </tr>
                                    ) : (
                                        airplanes.map((airplane) => (
                                            <tr key={airplane.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{airplane.registrationNumber || '-'}</td>
                                                <td className="px-6 py-4 font-semibold text-foreground">{airplane.model}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold">{airplane.airline?.name || '-'}</span>
                                                    <span className="text-xs font-mono ml-1 px-1.5 py-0.5 rounded bg-white/40 text-foreground/60">{airplane.airline?.code}</span>
                                                </td>
                                                <td className="px-6 py-4 text-emerald-600 font-bold">{airplane.capacity} Kursi</td>
                                                <td className="px-6 py-4 text-sm text-foreground/60 max-w-xs truncate">{airplane.description || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleOpenEdit(airplane)} className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-700 transition-all font-semibold">
                                                            ✏️ Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(airplane.id, airplane.model)} className="text-xs px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-700 transition-all font-semibold">
                                                            🗑️ Hapus
                                                        </button>
                                                    </div>
                                                </td>
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
                    <div className="glass-card max-w-md w-full p-8 rounded-3xl animate-scale-in relative border border-white/60">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-2xl text-foreground/60 hover:text-foreground">
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 gradient-text">
                            {isEditing ? 'Edit Pesawat' : 'Tambah Pesawat Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Maskapai Pemilik</label>
                                <select
                                    value={form.airlineId}
                                    onChange={(e) => setForm({ ...form, airlineId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                    required
                                >
                                    <option value="">-- Pilih Maskapai --</option>
                                    {airlines.map((airline) => (
                                        <option key={airline.id} value={airline.id}>
                                            {airline.name} ({airline.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Model Pesawat</label>
                                <input
                                    type="text"
                                    placeholder="Boeing 737-800 / Airbus A320"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">No. Registrasi</label>
                                    <input
                                        type="text"
                                        placeholder="PK-GAA"
                                        value={form.registrationNumber}
                                        onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-mono font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Kapasitas Kursi</label>
                                    <input
                                        type="number"
                                        placeholder="180"
                                        value={form.capacity}
                                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                        disabled={isEditing}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-bold text-emerald-600 disabled:opacity-75 disabled:cursor-not-allowed"
                                        required
                                    />
                                    {isEditing && <span className="text-[10px] text-foreground/50 mt-1 block">Kapasitas pesawat tidak bisa diubah setelah dibuat.</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Keterangan / Deskripsi</label>
                                <textarea
                                    placeholder="Konfigurasi standard regional..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm"
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-foreground/10 font-semibold hover:bg-black/5 transition-all">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all shadow-glow">
                                    {isEditing ? 'Simpan Perubahan' : 'Tambah Pesawat'}
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

export default function AirplanesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AirplanesContent />
        </Suspense>
    );
}
