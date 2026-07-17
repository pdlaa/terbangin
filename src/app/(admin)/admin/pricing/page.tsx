'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface Flight {
    id: string;
    flightNumber: string;
    departureTime: string;
    price: string;
    priceMultiplierBusiness: number | null;
    priceMultiplierFirst: number | null;
    airline?: { name: string; code: string };
    departureAirport?: { iataCode: string; city: string };
    arrivalAirport?: { iataCode: string; city: string };
}

function PricingContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form states
    const [price, setPrice] = useState('');
    const [multiplierBusiness, setMultiplierBusiness] = useState('');
    const [multiplierFirst, setMultiplierFirst] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/pricing');
            } else if (user.role !== 'admin') {
                toast.error('Hanya admin yang memiliki akses ke halaman ini');
                router.push('/admin/dashboard');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            loadFlights();
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

    const handleOpenEdit = (flight: Flight) => {
        setSelectedFlight(flight);
        setPrice(parseFloat(flight.price).toString());
        setMultiplierBusiness(flight.priceMultiplierBusiness ? flight.priceMultiplierBusiness.toString() : '1.5');
        setMultiplierFirst(flight.priceMultiplierFirst ? flight.priceMultiplierFirst.toString() : '2.0');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFlight) return;

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            toast.error('Harga dasar harus berupa angka positif');
            return;
        }

        const multBusiness = multiplierBusiness ? parseFloat(multiplierBusiness) : null;
        const multFirst = multiplierFirst ? parseFloat(multiplierFirst) : null;

        if (multBusiness !== null && (isNaN(multBusiness) || multBusiness <= 0)) {
            toast.error('Multiplier Business Class harus berupa angka positif');
            return;
        }

        if (multFirst !== null && (isNaN(multFirst) || multFirst <= 0)) {
            toast.error('Multiplier First Class harus berupa angka positif');
            return;
        }

        try {
            setSubmitLoading(true);
            const response = await fetch(`/api/admin/flights/${selectedFlight.id}/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: parsedPrice,
                    priceMultiplierBusiness: multBusiness,
                    priceMultiplierFirst: multFirst,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Harga penerbangan berhasil diperbarui');
                setShowModal(false);
                loadFlights();
            } else {
                toast.error(data.error || 'Gagal memperbarui harga');
            }
        } catch (error) {
            console.error('Error updating pricing:', error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setSubmitLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60 animate-pulse">Memuat otorisasi...</p>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
<AdminNavbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/dashboard" className="text-sky-600 hover:text-sky-700 mb-6 inline-flex items-center gap-2 font-medium">
                        ← Kembali ke Dashboard
                    </Link>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                                Manajemen <span className="gradient-text">Harga</span>
                            </h1>
                            <p className="text-foreground/60">Kelola harga dasar dan atur kelipatan tarif dinamis berdasarkan kelas kursi</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-foreground/60">Memuat data penerbangan...</p>
                        </div>
                    ) : (
                        <div className="glass-card rounded-3xl overflow-hidden shadow-glass border border-white/60">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/10 border-b border-white/20">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Flight</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Maskapai</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Rute</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Harga Base (Economy)</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Business Mult</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">First Mult</th>
                                            <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {flights.map((flight) => (
                                            <tr key={flight.id} className="hover:bg-white/10 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">{flight.flightNumber}</td>
                                                <td className="px-6 py-4 text-foreground/80">{flight.airline?.name || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-foreground/70">
                                                    {flight.departureAirport?.iataCode} → {flight.arrivalAirport?.iataCode}
                                                </td>
                                                <td className="px-6 py-4 text-emerald-600 font-extrabold">
                                                    {formatCurrency(parseFloat(flight.price))}
                                                </td>
                                                <td className="px-6 py-4 text-foreground/60 font-semibold">
                                                    {flight.priceMultiplierBusiness || '1.5'}x
                                                </td>
                                                <td className="px-6 py-4 text-foreground/60 font-semibold">
                                                    {flight.priceMultiplierFirst || '2.0'}x
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenEdit(flight)}
                                                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-sm"
                                                    >
                                                        ⚙️ Atur Harga
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Price Edit Modal */}
            {showModal && selectedFlight && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="glass-card max-w-md w-full p-8 rounded-3xl shadow-glow border border-white/80 animate-scale-up">
                        <h3 className="text-2xl font-bold mb-1">
                            Atur Harga <span className="gradient-text">{selectedFlight.flightNumber}</span>
                        </h3>
                        <p className="text-xs text-foreground/60 mb-6">
                            Penerbangan {selectedFlight.departureAirport?.iataCode} ke {selectedFlight.arrivalAirport?.iataCode}
                        </p>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-foreground/75 mb-2">Harga Dasar (Economy Class)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Contoh: 1000000"
                                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/40 text-foreground font-semibold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-foreground/75 mb-2">Business Multiplier</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={multiplierBusiness}
                                        onChange={(e) => setMultiplierBusiness(e.target.value)}
                                        placeholder="Default: 1.5"
                                        className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/40 text-foreground font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-foreground/75 mb-2">First Multiplier</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={multiplierFirst}
                                        onChange={(e) => setMultiplierFirst(e.target.value)}
                                        placeholder="Default: 2.0"
                                        className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/40 text-foreground font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Simulated Price Preview */}
                            <div className="bg-white/20 p-5 rounded-2xl border border-white/30 space-y-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Simulasi Harga Tiket:</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground/70">Economy:</span>
                                    <span className="font-extrabold text-slate-700">{formatCurrency(parseFloat(price) || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground/70">Business Class:</span>
                                    <span className="font-extrabold text-violet-600">
                                        {formatCurrency((parseFloat(price) || 0) * (parseFloat(multiplierBusiness) || 1.5))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground/70">First Class:</span>
                                    <span className="font-extrabold text-warm-dark">
                                        {formatCurrency((parseFloat(price) || 0) * (parseFloat(multiplierFirst) || 2.0))}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/60 hover:bg-white/40 font-bold transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all text-sm shadow-md"
                                >
                                    {submitLoading ? 'Menyimpan...' : 'Simpan Harga'}
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

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PricingContent />
        </Suspense>
    );
}
