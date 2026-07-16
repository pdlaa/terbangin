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
    availableSeats: number;
    airplane?: { model: string; capacity: number };
    departureAirport?: { iataCode: string; city: string };
    arrivalAirport?: { iataCode: string; city: string };
}

function CapacityContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form states
    const [availableSeats, setAvailableSeats] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/capacity');
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
        setAvailableSeats(flight.availableSeats.toString());
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFlight) return;

        const parsedSeats = parseInt(availableSeats, 10);
        if (isNaN(parsedSeats) || parsedSeats < 0) {
            toast.error('Kuota sisa kursi tidak boleh negatif');
            return;
        }

        const maxCap = selectedFlight.airplane?.capacity || 999;
        if (parsedSeats > maxCap) {
            toast.error(`Kuota kursi tidak boleh melebihi kapasitas pesawat (${maxCap})`);
            return;
        }

        try {
            setSubmitLoading(true);
            const response = await fetch(`/api/admin/flights/${selectedFlight.id}/capacity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    availableSeats: parsedSeats,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Kuota kursi berhasil diperbarui');
                setShowModal(false);
                loadFlights();
            } else {
                toast.error(data.error || 'Gagal memperbarui kuota');
            }
        } catch (error) {
            console.error('Error updating capacity:', error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setSubmitLoading(false);
        }
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
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/dashboard" className="text-sky-600 hover:text-sky-700 mb-6 inline-flex items-center gap-2 font-medium">
                        ← Kembali ke Dashboard
                    </Link>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                                Manajemen <span className="gradient-text">Kapasitas</span>
                            </h1>
                            <p className="text-foreground/60">Kelola kuota sisa kursi pesawat secara dinamis untuk setiap jadwal penerbangan aktif</p>
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
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Model Pesawat</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Rute</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Kapasitas Fisik</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Sisa Kuota Kursi</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Terisi (Terpesan)</th>
                                            <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {flights.map((flight) => {
                                            const totalCap = flight.airplane?.capacity || 0;
                                            const available = flight.availableSeats;
                                            const booked = Math.max(0, totalCap - available);
                                            const occupancyPercentage = totalCap > 0 ? (booked / totalCap) * 100 : 0;

                                            return (
                                                <tr key={flight.id} className="hover:bg-white/10 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{flight.flightNumber}</td>
                                                    <td className="px-6 py-4 text-foreground/80">{flight.airplane?.model || '-'}</td>
                                                    <td className="px-6 py-4 font-medium text-foreground/70">
                                                        {flight.departureAirport?.iataCode} → {flight.arrivalAirport?.iataCode}
                                                    </td>
                                                    <td className="px-6 py-4 text-foreground/60 font-semibold">{totalCap} Kursi</td>
                                                    <td className="px-6 py-4 font-extrabold text-indigo-600">{available} Kursi</td>
                                                    <td className="px-6 py-4 text-foreground/80">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-700">{booked} Kursi</span>
                                                            <span className="text-xs bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-600 font-bold">
                                                                {occupancyPercentage.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleOpenEdit(flight)}
                                                            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs transition-all shadow-sm"
                                                        >
                                                            📊 Atur Kuota
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Capacity Edit Modal */}
            {showModal && selectedFlight && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="glass-card max-w-md w-full p-8 rounded-3xl shadow-glow border border-white/80 animate-scale-up">
                        <h3 className="text-2xl font-bold mb-1">
                            Atur Kuota <span className="gradient-text">{selectedFlight.flightNumber}</span>
                        </h3>
                        <p className="text-xs text-foreground/60 mb-6">
                            Pesawat {selectedFlight.airplane?.model} (Kapasitas Maksimal: {selectedFlight.airplane?.capacity} Kursi)
                        </p>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase text-foreground/75 mb-2">Kuota Sisa Kursi Tersedia</label>
                                <input
                                    type="number"
                                    value={availableSeats}
                                    onChange={(e) => setAvailableSeats(e.target.value)}
                                    placeholder="Masukkan jumlah kursi sisa"
                                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/40 text-foreground font-semibold"
                                    required
                                />
                            </div>

                            <div className="bg-white/20 p-5 rounded-2xl border border-white/30 space-y-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Status Ringkasan:</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground/70">Kapasitas Fisik:</span>
                                    <span className="font-semibold text-slate-700">{selectedFlight.airplane?.capacity} Kursi</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground/70">Simulasi Terisi (Terpesan):</span>
                                    <span className="font-extrabold text-indigo-600">
                                        {Math.max(0, (selectedFlight.airplane?.capacity || 0) - (parseInt(availableSeats, 10) || 0))} Kursi
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
                                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all text-sm shadow-md"
                                >
                                    {submitLoading ? 'Menyimpan...' : 'Simpan Kuota'}
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

export default function CapacityPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CapacityContent />
        </Suspense>
    );
}
