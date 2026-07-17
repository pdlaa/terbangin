'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface Airport {
    id: string;
    name: string;
    city: string;
    country: string;
    iataCode: string;
    imageUrl?: string;
    timezone?: string;
}

function AirportsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [airports, setAirports] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        city: '',
        country: '',
        iataCode: '',
        imageUrl: '',
        timezone: '',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/airports');
            } else if (user.role !== 'admin') {
                toast.error('Hanya admin yang memiliki akses ke halaman ini');
                router.push('/admin/dashboard');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin'].includes(user.role)) {
            loadAirports();
        }
    }, [user]);

    const loadAirports = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/airports');
            if (response.ok) {
                const data = await response.json();
                setAirports(data.airports || []);
            } else {
                toast.error('Gagal mengambil data bandara');
            }
        } catch (error) {
            console.error('Error loading airports:', error);
            toast.error('Gagal memuat data bandara');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setForm({
            name: '',
            city: '',
            country: '',
            iataCode: '',
            imageUrl: '',
            timezone: '',
        });
        setIsEditing(false);
        setSelectedAirportId(null);
        setShowModal(true);
    };

    const handleOpenEdit = (airport: Airport) => {
        setForm({
            name: airport.name,
            city: airport.city,
            country: airport.country,
            iataCode: airport.iataCode,
            imageUrl: airport.imageUrl || '',
            timezone: airport.timezone || '',
        });
        setIsEditing(true);
        setSelectedAirportId(airport.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.iataCode.length !== 3) {
            toast.error('Kode IATA harus tepat 3 karakter');
            return;
        }

        const endpoint = isEditing ? `/api/admin/airports/${selectedAirportId}` : '/api/admin/airports';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditing ? 'Bandara berhasil diperbarui' : 'Bandara berhasil ditambahkan');
                setShowModal(false);
                loadAirports();
            } else {
                toast.error(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus bandara ${name}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/airports/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Bandara berhasil dihapus');
                loadAirports();
            } else {
                toast.error(data.error || 'Gagal menghapus bandara');
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
                                Manajemen <span className="gradient-text">Bandara</span>
                            </h1>
                            <p className="text-foreground/60">Kelola master data bandara asal & tujuan</p>
                        </div>
                        <button onClick={handleOpenCreate} className="glass-button px-6 py-3 font-semibold shadow-glow text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-all">
                            + Tambah Bandara
                        </button>
                    </div>

                    {/* Airports Table */}
                    <div className="glass-card rounded-3xl overflow-hidden shadow-glass">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 border-b border-white/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kode IATA</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nama Bandara</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kota</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Negara</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Zona Waktu</th>
                                        <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {airports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                                                Belum ada data bandara yang terdaftar.
                                            </td>
                                        </tr>
                                    ) : (
                                        airports.map((airport) => (
                                            <tr key={airport.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{airport.iataCode}</td>
                                                <td className="px-6 py-4 font-semibold">{airport.name}</td>
                                                <td className="px-6 py-4">{airport.city}</td>
                                                <td className="px-6 py-4">{airport.country}</td>
                                                <td className="px-6 py-4 text-sm text-foreground/60">{airport.timezone || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleOpenEdit(airport)} className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-700 transition-all font-semibold">
                                                            ✏️ Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(airport.id, airport.name)} className="text-xs px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-700 transition-all font-semibold">
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
                    <div className="glass-card max-w-lg w-full p-8 rounded-3xl animate-scale-in relative border border-white/60">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-2xl text-foreground/60 hover:text-foreground">
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 gradient-text">
                            {isEditing ? 'Edit Bandara' : 'Tambah Bandara Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Kode IATA</label>
                                    <input
                                        type="text"
                                        maxLength={3}
                                        placeholder="CGK"
                                        value={form.iataCode}
                                        onChange={(e) => setForm({ ...form, iataCode: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 uppercase text-center font-mono font-bold"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Nama Bandara</label>
                                    <input
                                        type="text"
                                        placeholder="Soekarno-Hatta International"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Kota</label>
                                    <input
                                        type="text"
                                        placeholder="Jakarta"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Negara</label>
                                    <input
                                        type="text"
                                        placeholder="Indonesia"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Zona Waktu (Timezone)</label>
                                    <input
                                        type="text"
                                        placeholder="Asia/Jakarta"
                                        value={form.timezone}
                                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Foto URL (Opsional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={form.imageUrl}
                                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-foreground/10 font-semibold hover:bg-black/5 transition-all">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all shadow-glow">
                                    {isEditing ? 'Simpan Perubahan' : 'Tambah Bandara'}
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

export default function AirportsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AirportsContent />
        </Suspense>
    );
}
