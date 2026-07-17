'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import { useAuth } from '@/context/auth-context';

function StaffDashboardContent() {
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
    const [todayFlights, setTodayFlights] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/staff/dashboard');
            } else if (!['staff', 'admin'].includes(user.role)) {
                toast.error('Anda tidak memiliki akses ke halaman ini');
                router.push('/');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['staff', 'admin'].includes(user.role)) {
            loadStats();
            loadTodayFlights();
        }
    }, [user]);

    const loadStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTodayFlights = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/flights/list?date=${today}&status=SCHEDULED`);
            if (response.ok) {
                const data = await response.json();
                setTodayFlights(data.flights?.slice(0, 5) || []);
            }
        } catch (error) {
            console.error('Error loading today flights:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-foreground/60 font-medium">Memuat dashboard staff...</p>
                </div>
            </div>
        );
    }

    if (!user || !['staff', 'admin'].includes(user.role)) return null;

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen sky-gradient">
            <AdminNavbar />
            <div className="pt-24 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 animate-fade-in-down">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-xs font-semibold mb-3">
                            🎫 Area Staff Operasional
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                            Dashboard <span className="gradient-text">Staff</span>
                        </h1>
                        <p className="text-foreground/60 text-lg">
                            Pantau jadwal penerbangan, validasi penumpang, dan operasional harian
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-10">
                        {[
                            { label: 'Total Penerbangan', val: stats.totalFlights, color: 'text-cyan-600', icon: '✈️' },
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

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Today's Flights */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass-card p-6 rounded-3xl border border-white/60">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">🛫 Jadwal Penerbangan Hari Ini</h2>
                                    <Link href="/admin/flights" className="text-sm text-sky font-semibold hover:underline">
                                        Lihat Semua →
                                    </Link>
                                </div>

                                {todayFlights.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-3">📅</div>
                                        <p className="text-foreground/60">Tidak ada jadwal penerbangan untuk hari ini</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {todayFlights.map((flight: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 hover:bg-white/60 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-sky/20 flex items-center justify-center">
                                                        <span className="font-bold text-sm text-cyan-600">{flight.airline?.code || '--'}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{flight.flightNumber}</div>
                                                        <div className="text-xs text-foreground/60">
                                                            {flight.departureAirport?.iataCode} → {flight.arrivalAirport?.iataCode}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatTime(flight.departureTime)}</div>
                                                    <div className="text-xs text-foreground/60">{flight.availableSeats} kursi tersisa</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/admin/passengers"
                                    className="glass-card hover:bg-white/50 p-6 rounded-3xl transition-all group cursor-pointer border border-white/60 hover:shadow-glass-hover"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold mb-1 text-foreground">Manifest Penumpang</h3>
                                            <p className="text-sm text-foreground/60">Lihat daftar penumpang per penerbangan</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
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
                                            <p className="text-sm text-foreground/60">Validasi tiket penumpang via QR Code</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            📷
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {/* Staff Info */}
                            <div className="glass-card p-6 rounded-3xl border border-white/60">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan to-sky flex items-center justify-center text-2xl shadow-glow">
                                        👤
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{user.name}</h3>
                                        <p className="text-xs text-foreground/60 capitalize">{user.role}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-foreground/50">
                                    {user.email}
                                </div>
                            </div>

                            {/* Today's Summary */}
                            <div className="glass-card p-6 rounded-3xl border border-white/60">
                                <h3 className="font-bold mb-4">📊 Ringkasan Hari Ini</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-foreground/60">Penerbangan Hari Ini</span>
                                        <span className="font-bold text-cyan-600">{todayFlights.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-foreground/60">Total Penumpang</span>
                                        <span className="font-bold text-sky-600">{stats.totalPassengers}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-foreground/60">Booking Perlu Dicek</span>
                                        <span className="font-bold text-amber-500">{stats.confirmedBookings}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="glass-card p-6 rounded-3xl border border-white/60">
                                <h3 className="font-bold mb-4">🔗 Akses Cepat</h3>
                                <div className="space-y-2">
                                    <Link href="/admin/flights" className="block px-4 py-2.5 rounded-xl bg-white/40 hover:bg-white/60 transition-all text-sm font-semibold">
                                        ✈️ Data Penerbangan
                                    </Link>
                                    <Link href="/admin/passengers" className="block px-4 py-2.5 rounded-xl bg-white/40 hover:bg-white/60 transition-all text-sm font-semibold">
                                        👥 Data Penumpang
                                    </Link>
                                    <Link href="/admin/scanner" className="block px-4 py-2.5 rounded-xl bg-white/40 hover:bg-white/60 transition-all text-sm font-semibold">
                                        📷 Scanner Boarding
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default function StaffDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <StaffDashboardContent />
        </Suspense>
    );
}