'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/flights/FlightCard';
import FlightFilters from '@/components/flights/FlightFilters';
import FlightSearchBar from '@/components/flights/FlightSearchBar';
import Navbar from '@/components/layout/Navbar';

// FIX UTAMA: Perbarui interface agar menyediakan relasi object sesuai kebutuhan FlightCard
interface Flight {
    id: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    price: any;
    availableSeats: number;
    status: string;
    airline: {
        code: string;
        name: string;
        logo: string | null;
    };
    departureAirport: {
        iataCode: string;
        name: string;
        city: string;
        country: string;
        timezone?: string;
    };
    arrivalAirport: {
        iataCode: string;
        name: string;
        city: string;
        country: string;
        timezone?: string;
    };
    airplane: {
        model: string;
        registrationNumber: string;
        capacity?: number;
    };
}

function SearchContent() {
    const searchParams = useSearchParams();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('price');

    useEffect(() => {
        const searchFlights = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                searchParams.forEach((value, key) => params.append(key, value));

                const response = await fetch(`/api/flights/search?${params}`);
                const data = await response.json();
                setFlights(data.flights || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        searchFlights();
    }, [searchParams]);

    const sortedFlights = [...flights].sort((a, b) => {
        if (sortBy === 'price') return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === 'duration') return a.duration - b.duration;
        if (sortBy === 'departure') return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        return 0;
    });

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />

            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold mb-6 text-center">
                        Hasil <span className="gradient-text">Pencarian</span>
                    </h1>

                    <div className="mb-8">
                        <FlightSearchBar />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Filters - Desktop */}
                        <div className="hidden lg:block">
                            <FlightFilters onFilterChange={() => { }} />
                        </div>

                        {/* Results */}
                        <div className="lg:col-span-3">
                            {/* Sort Options */}
                            <div className="glass-card p-4 mb-6 flex items-center justify-between">
                                <div className="text-foreground/60">
                                    Menampilkan <span className="font-semibold text-foreground">{flights.length}</span> penerbangan
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30"
                                >
                                    <option value="price">Harga Termurah</option>
                                    <option value="duration">Durasi Tercepat</option>
                                    <option value="departure">Waktu Keberangkatan</option>
                                </select>
                            </div>

                            {/* Flight List */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-sky animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    </div>
                                    <p className="text-foreground/60">Mencari penerbangan terbaik...</p>
                                </div>
                            ) : sortedFlights.length === 0 ? (
                                <div className="glass-card p-12 text-center">
                                    <div className="text-6xl mb-4">✈️</div>
                                    <h3 className="text-xl font-bold mb-2">Tidak ada penerbangan</h3>
                                    <p className="text-foreground/60">Coba ubah tanggal atau rute pencarian Anda</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sortedFlights.map((flight) => (
                                        <FlightCard key={flight.id} flight={flight} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FlightsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-sky animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}