'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

interface AnalyticsData {
    revenue: {
        daily: Array<{ date: string; amount: number }>;
        weekly: number;
        monthly: number;
        total: number;
    };
    occupancy: {
        averageRate: number;
        topRoutes: Array<{ route: string; occupancy: number; bookings: number; capacity: number }>;
    };
    tickets: {
        totalExpired: number;
        expiredRevenue: number;
        totalUsed: number;
        usedRevenue: number;
        conversionRate: number;
    };
}

function ManagerDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Silakan login terlebih dahulu');
            router.push('/auth/login?redirect=/manager/dashboard');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['manager'].includes(user.role)) {
            loadAnalytics();
        }
    }, [user]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/manager/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            } else {
                toast.error('Gagal memuat data analytics');
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading || !analytics) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60">Loading analytics...</p>
            </div>
        );
    }

    if (!user || !['manager'].includes(user.role)) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold mb-2">
                            Manager <span className="gradient-text">Dashboard</span>
                        </h1>
                        <p className="text-foreground/60">Analisis bisnis & keputusan strategis Terbangin</p>
                    </div>

                    {/* KPI Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Total Revenue</p>
                            <p className="text-2xl font-bold gradient-text">{formatCurrency(analytics.revenue.total)}</p>
                            <p className="text-xs text-foreground/40 mt-2">Seluruh waktu</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Revenue Bulan Ini</p>
                            <p className="text-2xl font-bold text-sky-500">{formatCurrency(analytics.revenue.monthly)}</p>
                            <p className="text-xs text-foreground/40 mt-2">30 hari terakhir</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Avg Occupancy</p>
                            <p className="text-2xl font-bold text-emerald-500">{analytics.occupancy.averageRate.toFixed(1)}%</p>
                            <p className="text-xs text-foreground/40 mt-2">Rata-rata keterisian</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl">
                            <p className="text-sm text-foreground/60 mb-2">Conversion Rate</p>
                            <p className="text-2xl font-bold text-cyan-500">{analytics.tickets.conversionRate.toFixed(1)}%</p>
                            <p className="text-xs text-foreground/40 mt-2">Booking to boarding</p>
                        </div>
                    </div>

                    {/* Revenue Chart Placeholder */}
                    <div className="glass-card p-8 rounded-2xl mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">📈 Revenue Chart</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPeriod('daily')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        period === 'daily'
                                            ? 'bg-sky-500 text-white'
                                            : 'glass-card text-foreground hover:bg-white/40'
                                    }`}
                                >
                                    Harian
                                </button>
                                <button
                                    onClick={() => setPeriod('weekly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        period === 'weekly'
                                            ? 'bg-sky-500 text-white'
                                            : 'glass-card text-foreground hover:bg-white/40'
                                    }`}
                                >
                                    Mingguan
                                </button>
                                <button
                                    onClick={() => setPeriod('monthly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        period === 'monthly'
                                            ? 'bg-sky-500 text-white'
                                            : 'glass-card text-foreground hover:bg-white/40'
                                    }`}
                                >
                                    Bulanan
                                </button>
                            </div>
                        </div>

                        <div className="h-64 bg-white/20 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-foreground/60 mb-2">📊 Chart visualization would go here</p>
                                <p className="text-sm text-foreground/40">
                                    Integrate with recharts or similar library for production
                                </p>
                            </div>
                        </div>

                        {/* Daily Revenue List */}
                        {period === 'daily' && analytics.revenue.daily.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-3">Breakdown Harian:</h3>
                                <div className="space-y-2">
                                    {analytics.revenue.daily.slice(-7).map((day, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                                            <span className="text-sm">{day.date}</span>
                                            <span className="font-semibold">{formatCurrency(day.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Occupancy Rate */}
                    <div className="glass-card p-8 rounded-2xl mb-8">
                        <h2 className="text-2xl font-bold mb-6">🎯 Occupancy Rate by Route</h2>
                        <div className="space-y-4">
                            {analytics.occupancy.topRoutes.map((route, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{route.route}</span>
                                        <span className="text-sm text-foreground/60">
                                            {route.bookings} / {route.capacity} penumpang
                                        </span>
                                    </div>
                                    <div className="w-full h-8 bg-white/20 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white"
                                            style={{ width: `${route.occupancy}%` }}
                                        >
                                            {route.occupancy > 30 && `${route.occupancy.toFixed(0)}%`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Status Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold mb-6">🎫 Tiket Hangus (No-Show)</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-foreground/60 mb-1">Total Tiket Hangus</p>
                                    <p className="text-3xl font-bold text-amber-500">{analytics.tickets.totalExpired}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-foreground/60 mb-1">Revenue dari Hangus</p>
                                    <p className="text-2xl font-bold text-emerald-500">
                                        {formatCurrency(analytics.tickets.expiredRevenue)}
                                    </p>
                                    <p className="text-xs text-foreground/40 mt-1">Keuntungan murni</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold mb-6">✅ Tiket Terpakai</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-foreground/60 mb-1">Total Tiket Terpakai</p>
                                    <p className="text-3xl font-bold text-emerald-500">{analytics.tickets.totalUsed}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-foreground/60 mb-1">Revenue dari Terpakai</p>
                                    <p className="text-2xl font-bold text-sky-500">
                                        {formatCurrency(analytics.tickets.usedRevenue)}
                                    </p>
                                    <p className="text-xs text-foreground/40 mt-1">Penumpang boarding</p>
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

export default function ManagerDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ManagerDashboardContent />
        </Suspense>
    );
}
