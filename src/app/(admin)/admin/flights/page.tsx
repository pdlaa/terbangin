'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

function FlightsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            toast.error('Gagal memuat data penerbangan');
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

    if (!user || !['admin'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold">
                            Manajemen <span className="gradient-text">Penerbangan</span>
                        </h1>
                        <Link href="/admin/flights/create" className="glass-button px-6 py-3 ripple">
                            + Tambah Penerbangan
                        </Link>
                    </div>

                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/20 border-b border-white/40">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">Nomor Penerbangan</th>
                                        <th className="px-6 py-4 text-left font-semibold">Rute</th>
                                        <th className="px-6 py-4 text-left font-semibold">Keberangkatan</th>
                                        <th className="px-6 py-4 text-left font-semibold">Kapasitas</th>
                                        <th className="px-6 py-4 text-left font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flights.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-foreground/60">
                                                Belum ada data penerbangan
                                            </td>
                                        </tr>
                                    ) : (
                                        flights.map((flight: any) => (
                                            <tr key={flight.id} className="border-b border-white/20 hover:bg-white/10">
                                                <td className="px-6 py-4 font-semibold">{flight.flightNumber}</td>
                                                <td className="px-6 py-4">
                                                    {flight.departureAirport?.iataCode} → {flight.arrivalAirport?.iataCode}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {new Date(flight.departureTime).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4">{flight.airplane?.capacity} kursi</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button className="text-xs px-3 py-1 rounded-lg bg-sky-500/30 hover:bg-sky-500/50 text-sky-300">
                                                            Edit
                                                        </button>
                                                        <button className="text-xs px-3 py-1 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-300">
                                                            Hapus
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
            <Toaster />
        </div>
    );
}

export default function FlightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <FlightsContent />
        </Suspense>
    );
}
