'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AdminNavbar from '@/components/layout/AdminNavbar';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

interface Passenger {
    id: string;
    bookingId: string;
    fullName: string;
    gender: string;
    birthDate: string;
    passportNumber: string;
    email: string;
    seatNumber?: string;
    bookingStatus: string;
}

interface FlightOption {
    id: string;
    flightNumber: string;
    departureTime: string;
    departureAirport?: { iataCode: string; city: string };
    arrivalAirport?: { iataCode: string; city: string };
}

function PassengersContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [flights, setFlights] = useState<FlightOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFlight, setSelectedFlight] = useState<string>('');
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login?redirect=/admin/passengers');
            } else if (!['admin', 'staff'].includes(user.role)) {
                toast.error('Anda tidak memiliki hak akses ke halaman Manifest');
                router.push('/');
            }
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin', 'staff'].includes(user.role)) {
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
            }
        } catch (error) {
            console.error('Error loading flights:', error);
            toast.error('Gagal mengambil daftar penerbangan');
        } finally {
            setLoading(false);
        }
    };

    const loadPassengers = async (flightId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/passengers?flightId=${flightId}`);
            if (response.ok) {
                const data = await response.json();
                setPassengers(data.passengers || []);
            } else {
                toast.error('Gagal memuat data manifest penumpang');
            }
        } catch (error) {
            console.error('Error loading passengers:', error);
            toast.error('Gagal memuat data manifest penumpang');
        } finally {
            setLoading(false);
        }
    };

    const handleFlightChange = (flightId: string) => {
        setSelectedFlight(flightId);
        if (flightId) {
            loadPassengers(flightId);
        } else {
            setPassengers([]);
        }
    };

    const handleAccCheckin = async (bookingId: string, passengerName: string) => {
        if (!confirm(`Konfirmasi check-in / boarding boarding pass atas nama ${passengerName}?`)) {
            return;
        }

        try {
            setActionLoadingId(bookingId);
            const response = await fetch(`/api/admin/bookings/${bookingId}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Check-in ${passengerName} sukses dikonfirmasi!`);
                if (selectedFlight) {
                    loadPassengers(selectedFlight);
                }
            } else {
                toast.error(data.error || 'Gagal memproses check-in');
            }
        } catch (error) {
            console.error('Checkin approval error:', error);
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setActionLoadingId(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60 animate-pulse font-medium">Memuat otorisasi...</p>
            </div>
        );
    }

    if (!user || !['admin', 'staff'].includes(user.role)) {
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
                            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                                Live Manifest <span className="gradient-text">Penumpang</span>
                            </h1>
                            <p className="text-foreground/60">Verifikasi status penerbangan dan konfirmasi boarding penumpang secara manual</p>
                        </div>
                    </div>

                    {/* Selector */}
                    <div className="glass-card p-6 mb-8 rounded-3xl border border-white/60">
                        <label className="block text-xs font-bold mb-2 uppercase text-foreground/70 tracking-wider">Pilih Penerbangan Terjadwal</label>
                        <select
                            value={selectedFlight}
                            onChange={(e) => handleFlightChange(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/30 font-semibold"
                        >
                            <option value="">-- Pilih Penerbangan Aktif --</option>
                            {flights.map((flight) => (
                                <option key={flight.id} value={flight.id}>
                                    {flight.flightNumber} - {flight.departureAirport?.iataCode} →{' '}
                                    {flight.arrivalAirport?.iataCode} ({new Date(flight.departureTime).toLocaleDateString('id-ID', { dateStyle: 'medium' })})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedFlight && loading && passengers.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-foreground/60">Mengambil manifest penumpang...</p>
                        </div>
                    ) : selectedFlight ? (
                        <div className="glass-card rounded-3xl overflow-hidden shadow-glass border border-white/60">
                            <div className="p-6 bg-white/20 border-b border-white/30 flex items-center justify-between">
                                <span className="text-sm font-bold text-indigo-700">MANIFEST KEBERANGKATAN</span>
                                <span className="text-xs font-bold bg-white/40 px-3 py-1.5 rounded-full text-foreground/75 shadow-sm">
                                    Total Penumpang: <span className="text-indigo-600 font-extrabold">{passengers.length} Orang</span>
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/10 border-b border-white/20">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nama Lengkap Penumpang</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Jenis Kelamin</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Tanggal Lahir</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Passport / NIK</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Email Kontak</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Nomor Kursi</th>
                                            <th className="px-6 py-4 text-left font-semibold text-foreground/80">Status Transaksi</th>
                                            <th className="px-6 py-4 text-center font-semibold text-foreground/80">Aksi / Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {passengers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-foreground/50 font-medium">
                                                    Belum ada tiket terpesan untuk jadwal penerbangan ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            passengers.map((p) => {
                                                const isConfirmed = p.bookingStatus === 'confirmed';
                                                const isUsed = p.bookingStatus === 'used';
                                                const isPending = p.bookingStatus === 'pending';

                                                return (
                                                    <tr key={p.id} className="hover:bg-white/10 transition-colors">
                                                         <td className="px-6 py-4 font-semibold text-foreground">{p.fullName}</td>
                                                         <td className="px-6 py-4 text-sm text-foreground/75 capitalize">{p.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</td>
                                                         <td className="px-6 py-4 text-sm text-foreground/75">
                                                             {new Date(p.birthDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                                         </td>
                                                         <td className="px-6 py-4 font-mono text-sm text-foreground/75">
                                                             {p.passportNumber.substring(0, 4) + '****'}
                                                         </td>
                                                         <td className="px-6 py-4 text-sm text-foreground/70">{p.email}</td>
                                                         <td className="px-6 py-4 font-mono font-bold text-indigo-600">{p.seatNumber || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                isUsed ? 'bg-emerald-500/20 text-emerald-600' :
                                                                isConfirmed ? 'bg-sky-500/20 text-sky-600' :
                                                                isPending ? 'bg-amber-500/20 text-amber-600' :
                                                                'bg-red-500/20 text-red-600'
                                                            }`}>
                                                                {isUsed ? 'Selesai (Used)' :
                                                                 isConfirmed ? 'Terkonfirmasi' :
                                                                 isPending ? 'Menunggu Bayar' :
                                                                 p.bookingStatus.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {isConfirmed ? (
                                                                <button
                                                                    onClick={() => handleAccCheckin(p.bookingId, p.fullName)}
                                                                    disabled={actionLoadingId === p.bookingId}
                                                                    className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-glow hover:scale-105 disabled:opacity-50"
                                                                >
                                                                    {actionLoadingId === p.bookingId ? 'Memproses...' : 'Acc Check-in'}
                                                                </button>
                                                            ) : isUsed ? (
                                                                <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                                                                    ✅ Boarded / Selesai
                                                                </span>
                                                            ) : isPending ? (
                                                                <span className="text-xs font-bold text-amber-500/70">
                                                                    ⏳ Belum Bayar
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-bold text-red-500/70">
                                                                    ❌ Batal / Hangus
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 glass-card rounded-3xl border border-white/60">
                            <p className="text-foreground/50 font-semibold">Silakan pilih salah satu jadwal penerbangan di atas untuk melihat manifest penumpang.</p>
                        </div>
                    )}
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default function PassengersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PassengersContent />
        </Suspense>
    );
}
