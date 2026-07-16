'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface Airline {
    id: string;
    name: string;
    code: string;
    logo?: string;
    description?: string;
}

function AirlinesContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAirlineId, setSelectedAirlineId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        logo: '',
        description: '',
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/airlines');
            } else if (user.role !== 'admin') {
                toast.error('Hanya admin yang memiliki akses ke halaman ini');
                router.push('/admin/dashboard');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin'].includes(user.role)) {
            loadAirlines();
        }
    }, [user]);

    const loadAirlines = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/airlines');
            if (response.ok) {
                const data = await response.json();
                setAirlines(data.airlines || []);
            } else {
                toast.error('Gagal mengambil data maskapai');
            }
        } catch (error) {
            console.error('Error loading airlines:', error);
            toast.error('Gagal memuat data maskapai');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setForm({
            name: '',
            code: '',
            logo: '',
            description: '',
        });
        setIsEditing(false);
        setSelectedAirlineId(null);
        setShowModal(true);
    };

    const handleOpenEdit = (airline: Airline) => {
        setForm({
            name: airline.name,
            code: airline.code,
            logo: airline.logo || '',
            description: airline.description || '',
        });
        setIsEditing(true);
        setSelectedAirlineId(airline.id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const endpoint = isEditing ? `/api/admin/airlines/${selectedAirlineId}` : '/api/admin/airlines';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(isEditing ? 'Maskapai berhasil diperbarui' : 'Maskapai berhasil ditambahkan');
                setShowModal(false);
                loadAirlines();
            } else {
                toast.error(data.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Terjadi kesalahan koneksi');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus maskapai ${name}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/airlines/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Maskapai berhasil dihapus');
                loadAirlines();
            } else {
                toast.error(data.error || 'Gagal menghapus maskapai');
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
                                Manajemen <span className="gradient-text">Maskapai</span>
                            </h1>
                            <p className="text-foreground/60">Kelola master data maskapai penerbangan partner</p>
                        </div>
                        <button onClick={handleOpenCreate} className="glass-button px-6 py-3 font-semibold shadow-glow text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-all">
                            + Tambah Maskapai
                        </button>
                    </div>

                    {/* Airlines Table */}
                    <div className="glass-card rounded-3xl overflow-hidden shadow-glass">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 border-b border-white/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kode Maskapai</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nama Maskapai</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground/80">Deskripsi</th>
                                        <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {airlines.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-foreground/50">
                                                Belum ada data maskapai yang terdaftar.
                                            </td>
                                        </tr>
                                    ) : (
                                        airlines.map((airline) => (
                                            <tr key={airline.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{airline.code}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center text-xl font-bold shadow-sm">
                                                            {airline.logo ? (
                                                                <img src={airline.logo} alt={airline.name} className="w-full h-full object-contain rounded-xl" />
                                                            ) : (
                                                                <span>✈️</span>
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-foreground">{airline.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-foreground/60 max-w-sm truncate">{airline.description || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleOpenEdit(airline)} className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-700 transition-all font-semibold">
                                                            ✏️ Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(airline.id, airline.name)} className="text-xs px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-700 transition-all font-semibold">
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
                            {isEditing ? 'Edit Maskapai' : 'Tambah Maskapai Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Kode Panggil (IATA Code)</label>
                                <input
                                    type="text"
                                    placeholder="GA / JT / ID"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 uppercase font-mono font-bold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Nama Maskapai</label>
                                <input
                                    type="text"
                                    placeholder="Garuda Indonesia"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Logo URL (Opsional)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={form.logo}
                                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase text-foreground/75">Deskripsi</label>
                                <textarea
                                    placeholder="Maskapai penerbangan nasional Indonesia..."
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
                                    {isEditing ? 'Simpan Perubahan' : 'Tambah Maskapai'}
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

export default function AirlinesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AirlinesContent />
        </Suspense>
    );
}
