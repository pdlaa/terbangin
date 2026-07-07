'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

function PassengersContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [passengers, setPassengers] = useState<any[]>([]);
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFlight, setSelectedFlight] = useState<string>('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user && ['admin'].includes(user.role)) {
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
                toast.error('Gagal memuat data penumpang');
            }
        } catch (error) {
            console.error('Error loading passengers:', error);
            toast.error('Gagal memuat data penumpang');
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

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60">Loading...</p>
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
                    <h1 className="text-4xl font-bold mb-8">
                        Live Manifest <span className="gradient-text">Penumpang</span>
                    </h1>

                    <div className="glass-card p-6 mb-8 rounded-2xl">
                        <label className="block text-sm font-semibold mb-3">Pilih Penerbangan</label>
                        <select
                            value={selectedFlight}
                            onChange={(e) => handleFlightChange(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            <option value="">-- Pilih Penerbangan --</option>
                            {flights.map((flight: any) => (
                                <option key={flight.id} value={flight.id}>
                                    {flight.flightNumber} - {flight.departureAirport?.iataCode} →{' '}
                                    {flight.arrivalAirport?.iataCode} ({new Date(flight.departureTime).toLocaleDateString('id-ID')})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedFlight && loading ? (
                        <div className="text-center py-12">
                            <p className="text-foreground/60">Loading passenger data...</p>
                        </div>
                    ) : selectedFlight ? (
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/20">
                                <p className="text-sm text-foreground/60">
                                    Total Penumpang: <span className="font-bold text-lg">{passengers.length}</span>
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/20 border-b border-white/40">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold">Nama Penumpang</th>
                                            <th className="px-6 py-4 text-left font-semibold">Email</th>
                                            <th className="px-6 py-4 text-left font-semibold">Kursi</th>
                                            <th className="px-6 py-4 text-left font-semibold">Status Booking</th>
                                            <th className="px-6 py-4 text-left font-semibold">Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {passengers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-foreground/60">
                                                    Tidak ada penumpang
                                                </td>
                                            </tr>
                                        ) : (
                                            passengers.map((p: any) => (
                                                <tr key={p.id} className="border-b border-white/20 hover:bg-white/10">
                                                    <td className="px-6 py-4 font-semibold">{p.fullName}</td>
                                                    <td className="px-6 py-4 text-sm">{p.email}</td>
                                                    <td className="px-6 py-4">{p.seatNumber || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-300">
                                                            {p.bookingStatus || 'Confirmed'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-foreground/60">⏳ Belum</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-card rounded-2xl">
                            <p className="text-foreground/60">Pilih penerbangan untuk melihat manifest penumpang</p>
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
