'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/flights/FlightCard';
import FlightSearchBar from '@/components/flights/FlightSearchBar';
import Navbar from '@/components/layout/Navbar';

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

    // Horizontal Quick Filters States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriceLimit, setSelectedPriceLimit] = useState<number>(5000000);
    const [selectedTime, setSelectedTime] = useState<string>('');

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

    // Handle filter reset
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedPriceLimit(5000000);
        setSelectedTime('');
    };

    // Client-side Filter Logic
    const filteredFlights = flights.filter((flight) => {
        // 1. Text Search (Flight number, Airline name, or Airport city/code)
        const q = searchQuery.toLowerCase().trim();
        if (q) {
            const flightNum = flight.flightNumber.toLowerCase();
            const airlineName = flight.airline?.name.toLowerCase() || '';
            const depCity = flight.departureAirport?.city.toLowerCase() || '';
            const arrCity = flight.arrivalAirport?.city.toLowerCase() || '';
            const depIata = flight.departureAirport?.iataCode.toLowerCase() || '';
            const arrIata = flight.arrivalAirport?.iataCode.toLowerCase() || '';

            if (
                !flightNum.includes(q) &&
                !airlineName.includes(q) &&
                !depCity.includes(q) &&
                !arrCity.includes(q) &&
                !depIata.includes(q) &&
                !arrIata.includes(q)
            ) {
                return false;
            }
        }

        // 2. Max Price Filter
        const price = parseFloat(flight.price);
        if (price > selectedPriceLimit) return false;

        // 3. Waktu Keberangkatan Filter (Pagi, Siang, Malam)
        if (selectedTime) {
            const depHour = new Date(flight.departureTime).getHours();
            if (selectedTime === 'pagi' && (depHour < 6 || depHour >= 12)) return false;
            if (selectedTime === 'siang' && (depHour < 12 || depHour >= 18)) return false;
            if (selectedTime === 'malam' && (depHour < 18 || depHour >= 24)) return false;
        }

        return true;
    });

    const sortedFlights = [...filteredFlights].sort((a, b) => {
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

                    {/* Horizontal Quick Search Filters Bar */}
                    <div className="glass-card p-6 mb-8 border border-white/60">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            {/* Text Search Input */}
                            <div className="flex-1 relative">
                                <span className="absolute inset-y-0 left-3.5 flex items-center text-foreground/40 text-sm">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Cari maskapai, No. penerbangan, atau kota..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm font-semibold placeholder:text-foreground/40 transition-all"
                                />
                            </div>

                            {/* Filters Group */}
                            <div className="flex flex-wrap items-center gap-6">
                                {/* Price Pills */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Harga Maks:</span>
                                    <div className="flex gap-1.5">
                                        {[
                                            { label: 'Semua', val: 5000000 },
                                            { label: '< 1.5jt', val: 1500000 },
                                            { label: '< 3.0jt', val: 3000000 },
                                        ].map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => setSelectedPriceLimit(p.val)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                    selectedPriceLimit === p.val
                                                        ? 'bg-sky text-white border-sky shadow-sm'
                                                        : 'bg-white/40 border-white/60 hover:bg-white/70 text-foreground/75'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Departure Time Pills */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Waktu Terbang:</span>
                                    <div className="flex gap-1.5">
                                        {[
                                            { label: 'Semua', val: '' },
                                            { label: 'Pagi', val: 'pagi' },
                                            { label: 'Siang', val: 'siang' },
                                            { label: 'Malam', val: 'malam' },
                                        ].map((t) => (
                                            <button
                                                key={t.label}
                                                onClick={() => setSelectedTime(t.val)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                    selectedTime === t.val
                                                        ? 'bg-sky text-white border-sky shadow-sm'
                                                        : 'bg-white/40 border-white/60 hover:bg-white/70 text-foreground/75'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset button */}
                                {(searchQuery || selectedPriceLimit !== 5000000 || selectedTime) && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider pl-2"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        {/* Sort Options & Counter */}
                        <div className="glass-card p-4 mb-6 flex items-center justify-between border border-white/60">
                            <div className="text-foreground/60 text-sm font-semibold">
                                Menampilkan <span className="font-extrabold text-sky-700">{sortedFlights.length}</span> penerbangan
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Urutkan:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 text-sm font-semibold"
                                >
                                    <option value="price">Harga Termurah</option>
                                    <option value="duration">Durasi Tercepat</option>
                                    <option value="departure">Waktu Keberangkatan</option>
                                </select>
                            </div>
                        </div>

                        {/* Flight List */}
                        {loading ? (
                            <div className="text-center py-20 glass-card border border-white/60">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-sky animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                                <p className="text-foreground/60 font-semibold">Mencari penerbangan terbaik...</p>
                            </div>
                        ) : sortedFlights.length === 0 ? (
                            <div className="glass-card p-16 text-center border border-white/60">
                                <div className="text-6xl mb-4">✈️</div>
                                <h3 className="text-xl font-bold mb-2">Tidak ada penerbangan</h3>
                                <p className="text-foreground/60">Coba ubah tanggal, kata kunci, atau bersihkan filter pencarian Anda</p>
                                {(searchQuery || selectedPriceLimit !== 5000000 || selectedTime) && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="mt-4 px-6 py-2.5 rounded-xl bg-sky text-white text-sm font-bold hover:bg-sky-dark transition-all"
                                    >
                                        Bersihkan Filter
                                    </button>
                                )}
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