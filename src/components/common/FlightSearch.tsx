'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AirportAutocomplete from './AirportAutocomplete';

interface Airport {
    id: string;
    iataCode: string;
    name: string;
    city: string;
    country: string;
    imageUrl: string | null;
}

export default function FlightSearch() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        date: '',
        passengers: '1',
        class: 'economy',
    });
    const [fromAirport, setFromAirport] = useState<Airport | null>(null);
    const [toAirport, setToAirport] = useState<Airport | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromAirport || !toAirport) return;
        const params = new URLSearchParams({
            from: fromAirport.iataCode,
            to: toAirport.iataCode,
            date: formData.date,
            passengers: formData.passengers,
            class: formData.class,
        });
        router.push(`/customer/flights?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="glass-card p-6 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* From */}
                <div className="lg:col-span-1">
                    <AirportAutocomplete
                        label="Dari"
                        placeholder="Kota asal"
                        icon={
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        }
                        iconColor="#2563EB"
                        focusColor="sky"
                        value={formData.from}
                        onChange={(airport) => {
                            setFromAirport(airport);
                            if (airport) setFormData({ ...formData, from: airport.iataCode });
                        }}
                        exclude={toAirport?.iataCode}
                    />
                </div>

                {/* To */}
                <div className="lg:col-span-1">
                    <AirportAutocomplete
                        label="Ke"
                        placeholder="Kota tujuan"
                        icon={
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        }
                        iconColor="#06B6D4"
                        focusColor="cyan"
                        value={formData.to}
                        onChange={(airport) => {
                            setToAirport(airport);
                            if (airport) setFormData({ ...formData, to: airport.iataCode });
                        }}
                        exclude={fromAirport?.iataCode}
                    />
                </div>

                {/* Date */}
                <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Tanggal</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm transition-all"
                        />
                    </div>
                </div>

                {/* Passengers */}
                <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Penumpang</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <select
                            value={formData.passengers}
                            onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all appearance-none"
                        >
                            <option value="1">1 Penumpang</option>
                            <option value="2">2 Penumpang</option>
                            <option value="3">3 Penumpang</option>
                            <option value="4">4+ Penumpang</option>
                        </select>
                    </div>
                </div>

                {/* Search Button */}
                <div className="lg:col-span-1 flex items-end">
                    <button
                        type="submit"
                        disabled={!fromAirport || !toAirport}
                        className="w-full glass-button py-3 px-6 flex items-center justify-center gap-2 ripple disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <span className="font-semibold">Cari</span>
                    </button>
                </div>
            </div>

            {/* Class Selector */}
            <div className="mt-6 flex flex-wrap gap-3">
                {['economy', 'business', 'first'].map((cls) => (
                    <button
                        key={cls}
                        type="button"
                        onClick={() => setFormData({ ...formData, class: cls })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formData.class === cls
                                ? 'bg-gradient-to-r from-sky to-cyan text-white shadow-glow'
                                : 'bg-white/50 text-foreground/70 hover:bg-white/80'
                            }`}
                    >
                        {cls === 'economy' ? '🛫 Ekonomi' : cls === 'business' ? '💼 Bisnis' : '👑 First Class'}
                    </button>
                ))}
            </div>
        </form>
    );
}
