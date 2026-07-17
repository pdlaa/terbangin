'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import { useAuth } from '@/context/auth-context';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AirlineRevenue {
    name: string;
    revenue: number;
}

interface ClassOccupancy {
    class: string;
    count: number;
    percentage: number;
}

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
    revenueByAirline: AirlineRevenue[];
    occupancyByClass: ClassOccupancy[];
}

function ManagerDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/manager/dashboard');
            } else if (!['manager', 'admin'].includes(user.role)) {
                toast.error('Anda tidak memiliki akses ke Dashboard Manager');
                router.push('/');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['manager', 'admin'].includes(user.role)) {
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

    if (authLoading || (loading && !analytics)) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground/60 font-medium animate-pulse">Memuat data analisis...</p>
                </div>
            </div>
        );
    }

    if (!user || !['manager', 'admin'].includes(user.role) || !analytics) {
        return null;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Chart 1: Daily Revenue (Line/Bar)
    const dailyData = analytics.revenue.daily.slice(-7);
    const revenueChartData = {
        labels: dailyData.map(d => d.date),
        datasets: [
            {
                label: 'Pendapatan Harian',
                data: dailyData.map(d => d.amount),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 8,
                fill: true,
                tension: 0.3,
            }
        ]
    };

    // Chart 2: Revenue by Airline (Doughnut)
    const airlineData = analytics.revenueByAirline || [];
    const airlineColors = [
        'rgba(99, 102, 241, 0.8)',   // indigo
        'rgba(6, 182, 212, 0.8)',    // cyan
        'rgba(244, 63, 94, 0.8)',    // rose
        'rgba(16, 185, 129, 0.8)',   // emerald
        'rgba(245, 158, 11, 0.8)',   // amber
        'rgba(139, 92, 246, 0.8)',   // violet
    ];
    const airlineChartData = {
        labels: airlineData.map(a => a.name),
        datasets: [
            {
                label: 'Revenue',
                data: airlineData.map(a => a.revenue),
                backgroundColor: airlineColors.slice(0, airlineData.length),
                borderColor: '#ffffff',
                borderWidth: 2,
            }
        ]
    };

    // Chart 3: Occupancy by Class (Doughnut)
    const classData = analytics.occupancyByClass || [];
    const classChartData = {
        labels: classData.map(c => c.class),
        datasets: [
            {
                label: 'Jumlah Penumpang',
                data: classData.map(c => c.count),
                backgroundColor: [
                    'rgba(14, 165, 233, 0.8)',  // economy (sky)
                    'rgba(139, 92, 246, 0.8)',  // business (violet)
                    'rgba(249, 115, 22, 0.8)',  // first (orange)
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
            }
        ]
    };

    return (
        <div className="min-h-screen sky-gradient pb-16">
            <Toaster />
            
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    nav, .no-print, button {
                        display: none !important;
                    }
                    .pt-24 {
                        padding-top: 0 !important;
                    }
                    .glass-card {
                        background: white !important;
                        border: 1px solid #e2e8f0 !important;
                        box-shadow: none !important;
                        page-break-inside: avoid;
                        margin-bottom: 20px !important;
                    }
                    .sky-gradient {
                        background: none !important;
                    }
                }
            `}</style>

            <div className="no-print">
                <AdminNavbar />
            </div>

            <div className="pt-24 px-6">
                <div className="max-w-7xl mx-auto printable-area">
                    
                    {/* Print Header */}
                    <div className="hidden print:block mb-8 border-b-2 border-indigo-500 pb-4">
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LAPORAN ANALISIS STRATEGIS - TERBANGIN</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Tanggal Cetak: {new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                        <p className="text-xs text-slate-400">
                            Dicetak oleh: {user.name} ({user.role.toUpperCase()})
                        </p>
                    </div>

                    {/* Dashboard Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 no-print">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 text-xs font-semibold mb-3">
                                📊 Portal Analisis Strategis
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                                Manager <span className="gradient-text">Dashboard</span>
                            </h1>
                            <p className="text-foreground/60 text-lg">Analisis rute rill, kelas penerbangan, revenue maskapai, dan okupansi kursi</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadAnalytics}
                                className="px-5 py-2.5 rounded-xl border border-white/60 hover:bg-white/40 font-semibold text-sm transition-all"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="glass-button px-6 py-2.5 text-sm flex items-center gap-2 font-bold shadow-glow transition-all"
                            >
                                🖨️ Ekspor PDF / Cetak
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="glass-card p-6 rounded-2xl border border-white/60">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Total Pendapatan</p>
                            <p className="text-2xl font-extrabold text-indigo-600 tracking-tight">{formatCurrency(analytics.revenue.total)}</p>
                            <p className="text-[10px] text-foreground/45 mt-2 font-medium">Akumulasi seluruh transaksi lunas</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/60">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Pendapatan Bulan Ini</p>
                            <p className="text-2xl font-extrabold text-sky-500 tracking-tight">{formatCurrency(analytics.revenue.monthly)}</p>
                            <p className="text-[10px] text-foreground/45 mt-2 font-medium">30 hari terakhir</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/60">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Rata-rata Okupansi</p>
                            <p className="text-2xl font-extrabold text-emerald-500 tracking-tight">{analytics.occupancy.averageRate.toFixed(1)}%</p>
                            <p className="text-[10px] text-foreground/45 mt-2 font-medium">Rata-rata keterisian rute</p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl border border-white/60">
                            <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Rasio Boarding</p>
                            <p className="text-2xl font-extrabold text-cyan-500 tracking-tight">{analytics.tickets.conversionRate.toFixed(1)}%</p>
                            <p className="text-[10px] text-foreground/45 mt-2 font-medium">Konversi tiket ke status Used</p>
                        </div>
                    </div>

                    {/* Chart Row 1: Daily Revenue & Airline Share */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Daily Revenue Trend */}
                        <div className="glass-card p-8 rounded-3xl border border-white/60 lg:col-span-2">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">📈 Tren Pendapatan Harian</h2>
                                <p className="text-xs text-foreground/60">Visualisasi statistik perolehan transaksi 7 hari terakhir</p>
                            </div>
                            <div className="h-72 w-full bg-white/20 p-4 rounded-2xl border border-white/30 flex items-center justify-center">
                                {dailyData.length === 0 ? (
                                    <p className="text-foreground/50 text-sm">Belum ada data transaksi</p>
                                ) : (
                                    <Bar 
                                        data={revenueChartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                            },
                                            scales: {
                                                y: {
                                                    ticks: {
                                                        callback: (value) => `${(Number(value) / 1000).toFixed(0)}k`,
                                                    }
                                                }
                                            }
                                        }} 
                                    />
                                )}
                            </div>
                        </div>

                        {/* Revenue by Airline */}
                        <div className="glass-card p-8 rounded-3xl border border-white/60">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">✈️ Pendapatan per Maskapai</h2>
                                <p className="text-xs text-foreground/60">Kontribusi penjualan tiket lunas dari masing-masing brand maskapai</p>
                            </div>
                            <div className="h-72 w-full bg-white/20 p-4 rounded-2xl border border-white/30 flex items-center justify-center">
                                {airlineData.length === 0 ? (
                                    <p className="text-foreground/50 text-sm">Belum ada maskapai dengan transaksi lunas</p>
                                ) : (
                                    <Doughnut 
                                        data={airlineChartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: { boxWidth: 12, font: { size: 10 } }
                                                }
                                            }
                                        }} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart Row 2: Occupancy by Class & Popular Routes */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Occupancy by Class */}
                        <div className="glass-card p-8 rounded-3xl border border-white/60">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">💺 Okupansi Kelas Kursi</h2>
                                <p className="text-xs text-foreground/60">Distribusi keterisian kelas penerbangan Economy, Business, dan First Class</p>
                            </div>
                            <div className="h-72 w-full bg-white/20 p-4 rounded-2xl border border-white/30 flex items-center justify-center">
                                {classData.every(c => c.count === 0) ? (
                                    <p className="text-foreground/50 text-sm">Belum ada data penumpang terdaftar</p>
                                ) : (
                                    <Doughnut 
                                        data={classChartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: { boxWidth: 12, font: { size: 10 } }
                                                }
                                            }
                                        }} 
                                    />
                                )}
                            </div>
                        </div>

                        {/* Popular Route Ranking */}
                        <div className="glass-card p-8 rounded-3xl border border-white/60 lg:col-span-2">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">🏆 Ranking Rute Terpopuler (Booking Count)</h2>
                                <p className="text-xs text-foreground/60">Urutan rute perjalanan berdasarkan jumlah transaksi pemesanan tiket</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/20 text-foreground/50 uppercase tracking-wider text-xs">
                                            <th className="py-3 px-4 font-bold">No</th>
                                            <th className="py-3 px-4 font-bold">Rute Perjalanan</th>
                                            <th className="py-3 px-4 font-bold text-center">Jumlah Booking</th>
                                            <th className="py-3 px-4 font-bold text-center">Kapasitas</th>
                                            <th className="py-3 px-4 font-bold text-right">Rata Okupansi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 font-medium">
                                        {analytics.occupancy.topRoutes.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-foreground/40">Belum ada pemesanan terkonfirmasi</td>
                                            </tr>
                                        ) : (
                                            analytics.occupancy.topRoutes.map((route, idx) => (
                                                <tr key={idx} className="hover:bg-white/10 transition-colors">
                                                    <td className="py-3.5 px-4 font-bold text-indigo-600">#{idx + 1}</td>
                                                    <td className="py-3.5 px-4 font-bold text-slate-800">✈️ {route.route}</td>
                                                    <td className="py-3.5 px-4 text-center text-slate-700">{route.bookings} Tiket</td>
                                                    <td className="py-3.5 px-4 text-center text-foreground/60">{route.capacity} Seat</td>
                                                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                                                        {route.occupancy.toFixed(0)}%
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-8 rounded-3xl border border-white/60">
                            <h2 className="text-xl font-bold mb-2 tracking-tight">🎫 Penjualan Tiket Hangus (No-Show)</h2>
                            <p className="text-xs text-foreground/60 mb-6">Analisis tiket yang hangus dan tidak dipergunakan untuk boarding</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/40 p-5 rounded-2xl border border-white/60">
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Total Tiket Hangus</p>
                                    <p className="text-4xl font-extrabold text-amber-500 tracking-tight mt-1">{analytics.tickets.totalExpired}</p>
                                    <p className="text-[9px] text-foreground/40 mt-2 font-medium">Status transaksi Expired</p>
                                </div>
                                <div className="bg-white/40 p-5 rounded-2xl border border-white/60">
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Pendapatan Hangus</p>
                                    <p className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1.5">{formatCurrency(analytics.tickets.expiredRevenue)}</p>
                                    <p className="text-[9px] text-foreground/40 mt-2 font-medium">Uang tiket tetap masuk penuh</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-3xl border border-white/60">
                            <h2 className="text-xl font-bold mb-2 tracking-tight">✅ Boarding Penumpang Sukses</h2>
                            <p className="text-xs text-foreground/60 mb-6">Statistik tiket yang berhasil dipergunakan untuk terbang</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/40 p-5 rounded-2xl border border-white/60">
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Tiket Selesai Boarded</p>
                                    <p className="text-4xl font-extrabold text-emerald-500 tracking-tight mt-1">{analytics.tickets.totalUsed}</p>
                                    <p className="text-[9px] text-foreground/40 mt-2 font-medium">Boarding lengkap / Check-in sukses</p>
                                </div>
                                <div className="bg-white/40 p-5 rounded-2xl border border-white/60">
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wide">Pendapatan Terpakai</p>
                                    <p className="text-2xl font-extrabold text-indigo-600 tracking-tight mt-1.5">{formatCurrency(analytics.tickets.usedRevenue)}</p>
                                    <p className="text-[9px] text-foreground/40 mt-2 font-medium">Revenue penumpang berangkat</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
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
