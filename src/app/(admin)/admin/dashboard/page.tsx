'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

function AdminDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        totalFlights: 0,
        activeFlights: 0,
        totalPassengers: 0,
        confirmedBookings: 0,
        expiredTickets: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/dashboard');
            } else if (!['admin', 'staff'].includes(user.role)) {
                toast.error('Anda tidak memiliki akses ke Dashboard Admin/Staff');
                router.push('/');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin', 'staff'].includes(user.role)) {
            loadStats();
        }
    }, [user]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Gagal memuat statistik');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground/60 font-medium">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user || !['admin', 'staff'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 animate-fade-in-down">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-semibold mb-3">
                            🛡️ Area Operasional - Mode {user.role.toUpperCase()}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                            Dashboard <span className="gradient-text">Operasional</span>
                        </h1>
                        <p className="text-foreground/60 text-lg">Kelola master data, jadwal penerbangan, dan validasi penumpang</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-10">
                        {[
                            { label: 'Total Penerbangan', val: stats.totalFlights, color: 'text-indigo-600', icon: '✈️' },
                            { label: 'Penerbangan Aktif', val: stats.activeFlights, color: 'text-emerald-500', icon: '🟢' },
                            { label: 'Total Penumpang', val: stats.totalPassengers, color: 'text-sky-500', icon: '👥' },
                            { label: 'Booking Aktif', val: stats.confirmedBookings, color: 'text-cyan-500', icon: '📝' },
                            { label: 'Tiket Hangus', val: stats.expiredTickets, color: 'text-amber-500', icon: '⚠️' },
                        ].map((s, idx) => (
                            <div key={idx} className="glass-card p-5 rounded-2xl border border-white/60 hover:shadow-glass-hover transition-all group flex flex-col justify-between h-32 relative overflow-hidden">
                                <div className="absolute top-2 right-2 text-2xl opacity-10 group-hover:opacity-30 group-hover:scale-125 transition-all">
                                    {s.icon}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">{s.label}</p>
                                <p className={`text-3.5xl font-extrabold ${s.color} tracking-tight`}>{s.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action Sections */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                ⚡ Tindakan Cepat <span className="text-xs font-medium text-foreground/40">(Operasional)</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link
                                    href="/admin/flights"
                                    className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1 text-foreground">Manajemen Penerbangan</h3>
                                            <p className="text-sm text-foreground/60">Buat, edit, dan hapus jadwal penerbangan aktif</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            ✈️
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/passengers"
                                    className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1 text-foreground">Manifest Penumpang</h3>
                                            <p className="text-sm text-foreground/60">Lihat manifest & acc check-in tiket penumpang</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            👥
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/scanner"
                                    className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1 text-foreground">QR Scanner Boarding</h3>
                                            <p className="text-sm text-foreground/60">Validasi kode booking via kamera atau input manual</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            📷
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Master Data */}
                        {user.role === 'admin' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    🗄️ Manajemen Data Master <span className="text-xs font-medium text-indigo-500">(Khusus Admin)</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <Link
                                        href="/admin/airports"
                                        className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold mb-1 text-foreground">Data Bandara</h3>
                                                <p className="text-sm text-foreground/60">Kelola kota, bandara, IATA, & foto bandara</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                🏢
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/admin/airlines"
                                        className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold mb-1 text-foreground">Data Maskapai</h3>
                                                <p className="text-sm text-foreground/60">Kelola maskapai penerbangan partner & logo</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                🦅
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/admin/airplanes"
                                        className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold mb-1 text-foreground">Data Armada Pesawat</h3>
                                                <p className="text-sm text-foreground/60">Kelola registrasi, model, & denah kursi pesawat</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                🛫
                                            </div>
                                        </div>
                                    </Link>

                                    <Link
                                        href="/admin/seats"
                                        className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold mb-1 text-foreground">Seat Layout Editor</h3>
                                                <p className="text-sm text-foreground/60">Atur tata letak kursi Economy, Business & First Class</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                💺
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Management */}
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                ⚙️ Konfigurasi Sistem <span className="text-xs font-medium text-foreground/40">(Pengembangan)</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/admin/pricing"
                                    className="glass-card hover:bg-white/50 p-5 rounded-2xl transition-all flex items-center justify-between border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div>
                                        <h3 className="font-semibold text-foreground">Manajemen Harga Dinamis</h3>
                                        <p className="text-sm text-foreground/60">Atur perkalian kelas kursi & promosi</p>
                                    </div>
                                    <span className="text-xl">💰</span>
                                </Link>

                                <Link
                                    href="/admin/capacity"
                                    className="glass-card hover:bg-white/50 p-5 rounded-2xl transition-all flex items-center justify-between border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div>
                                        <h3 className="font-semibold text-foreground">Manajemen Kuota</h3>
                                        <p className="text-sm text-foreground/60">Pantau & overbook kapasitas penerbangan</p>
                                    </div>
                                    <span className="text-xl">🪑</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
