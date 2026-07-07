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
        if (!authLoading && !user) {
            toast.error('Silakan login terlebih dahulu');
            router.push('/auth/login?redirect=/admin/dashboard');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin', 'manager'].includes(user.role)) {
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
                <p className="text-foreground/60">Loading...</p>
            </div>
        );
    }

    if (!user || !['admin', 'manager'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold mb-2">
                            Admin <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-foreground/60">Kelola operasional penerbangan Terbangin</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Total Penerbangan</p>
                            <p className="text-3xl font-bold gradient-text">{stats.totalFlights}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Penerbangan Aktif</p>
                            <p className="text-3xl font-bold text-emerald-500">{stats.activeFlights}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Total Penumpang</p>
                            <p className="text-3xl font-bold text-sky-500">{stats.totalPassengers}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Booking Aktif</p>
                            <p className="text-3xl font-bold text-cyan-500">{stats.confirmedBookings}</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Tiket Hangus</p>
                            <p className="text-3xl font-bold text-amber-500">{stats.expiredTickets}</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/admin/flights"
                                className="glass-card hover:bg-white/50 p-6 rounded-2xl transition-all group cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">Manajemen Penerbangan</h3>
                                        <p className="text-sm text-foreground/60">CRUD jadwal & rute penerbangan</p>
                                    </div>
                                    <span className="text-3xl group-hover:scale-110 transition-transform">✈️</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/passengers"
                                className="glass-card hover:bg-white/50 p-6 rounded-2xl transition-all group cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">Manifest Penumpang</h3>
                                        <p className="text-sm text-foreground/60">Lihat & kelola penumpang aktif</p>
                                    </div>
                                    <span className="text-3xl group-hover:scale-110 transition-transform">👥</span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/scanner"
                                className="glass-card hover:bg-white/50 p-6 rounded-2xl transition-all group cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">QR Scanner</h3>
                                        <p className="text-sm text-foreground/60">Pindai boarding pass penumpang</p>
                                    </div>
                                    <span className="text-3xl group-hover:scale-110 transition-transform">📷</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Menu Tambahan */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href="/admin/pricing"
                                className="glass-card hover:bg-white/50 p-4 rounded-2xl transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold">Manajemen Harga</h3>
                                    <p className="text-sm text-foreground/60">Set harga dinamis & promo</p>
                                </div>
                                <span>💰</span>
                            </Link>

                            <Link
                                href="/admin/capacity"
                                className="glass-card hover:bg-white/50 p-4 rounded-2xl transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold">Manajemen Kuota</h3>
                                    <p className="text-sm text-foreground/60">Pantau & atur kapasitas kursi</p>
                                </div>
                                <span>🪑</span>
                            </Link>
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
