'use client';

import { useState, useEffect } from 'react';

interface Seat {
    id: string;
    seatNumber: string;
    class: string;
    isAvailable: boolean;
}

interface SeatPickerProps {
    flightId: string;
    selectedSeats: string[];
    onSeatToggle: (seatId: string, seatNumber: string, seatClass: string) => void;
    maxSeats: number;
    passengerIndex?: number;
}

export default function SeatPicker({ flightId, selectedSeats, onSeatToggle, maxSeats }: SeatPickerProps) {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeClass, setActiveClass] = useState<string>('economy');

    useEffect(() => {
        loadSeats();
    }, [flightId]);

    const loadSeats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/flights/${flightId}/seats`);
            if (!res.ok) throw new Error('Gagal memuat kursi');
            const data = await res.json();
            setSeats(data.seats || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredSeats = seats.filter((s) => s.class === activeClass);
    const seatsByRow: { [key: string]: Seat[] } = {};
    filteredSeats.forEach((seat) => {
        const row = seat.seatNumber.replace(/[A-Z]/g, '');
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
    });

    const sortedRows = Object.keys(seatsByRow)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .slice(0, 10);

    const seatLabel = (num: string) => num.replace(/[0-9]/g, '');

    const getClassColor = (cls: string) => {
        switch (cls) {
            case 'economy': return { bg: 'bg-sky-500', selected: 'bg-sky-500', border: 'border-sky-300', text: 'text-sky-700' };
            case 'business': return { bg: 'bg-amber-500', selected: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-700' };
            case 'first': return { bg: 'bg-purple-500', selected: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-700' };
            default: return { bg: 'bg-gray-500', selected: 'bg-gray-500', border: 'border-gray-300', text: 'text-gray-700' };
        }
    };

    const handleSeatClick = (seat: Seat) => {
        if (!seat.isAvailable) return;
        if (selectedSeats.includes(seat.id)) {
            onSeatToggle(seat.id, seat.seatNumber, seat.class);
        } else if (selectedSeats.length < maxSeats) {
            onSeatToggle(seat.id, seat.seatNumber, seat.class);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-foreground/60 text-sm">Memuat denah kursi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-500 font-medium mb-2">{error}</p>
                <button onClick={loadSeats} className="text-sky text-sm hover:underline">Coba lagi</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Class Selector */}
            <div className="flex gap-2">
                {['economy', 'business', 'first'].map((cls) => {
                    const count = seats.filter((s) => s.class === cls).length;
                    const available = seats.filter((s) => s.class === cls && s.isAvailable).length;
                    const colors = getClassColor(cls);
                    return (
                        <button
                            key={cls}
                            onClick={() => setActiveClass(cls)}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                activeClass === cls
                                    ? `${colors.bg} text-white shadow-lg scale-105 border-transparent`
                                    : 'bg-white/50 text-foreground/70 border-white/60 hover:bg-white/80'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span>{cls === 'economy' ? '🛫' : cls === 'business' ? '💼' : '👑'}</span>
                                <span className="font-semibold capitalize">{cls}</span>
                            </div>
                            <div className="text-xs mt-1 opacity-80">{available}/{count} tersedia</div>
                        </button>
                    );
                })}
            </div>

            {/* Aircraft Cabin Visual */}
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/60">
                {/* Cockpit */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-8 rounded-t-full bg-gradient-to-r from-sky/30 to-cyan/30 border border-white/40 flex items-center justify-center text-xs text-foreground/50 font-medium">
                        ✈️ Kokpit
                    </div>
                </div>

                {/* Seat Grid */}
                <div className="max-w-md mx-auto space-y-2">
                    {sortedRows.map((rowNum) => {
                        const rowSeats = seatsByRow[rowNum].sort((a, b) =>
                            seatLabel(a.seatNumber).localeCompare(seatLabel(b.seatNumber))
                        );
                        return (
                            <div key={rowNum} className="flex items-center gap-1.5">
                                {/* Row Number */}
                                <div className="w-6 text-xs font-mono text-foreground/40 text-right mr-1">{rowNum}</div>

                                {/* Left seats (A, B) */}
                                <div className="flex-1 flex justify-end gap-1.5">
                                    {rowSeats.slice(0, Math.ceil(rowSeats.length / 2)).map((seat) => {
                                        const isSelected = selectedSeats.includes(seat.id);
                                        const colors = getClassColor(seat.class);
                                        return (
                                            <button
                                                key={seat.id}
                                                disabled={!seat.isAvailable && !isSelected}
                                                onClick={() => handleSeatClick(seat)}
                                                title={`${seat.seatNumber} - ${seat.class}${!seat.isAvailable ? ' (Terisi)' : ''}`}
                                                className={`
                                                    w-9 h-9 md:w-10 md:h-10 rounded-lg text-xs font-bold transition-all duration-200
                                                    ${!seat.isAvailable && !isSelected
                                                        ? 'bg-red-100 text-red-400 cursor-not-allowed border border-red-200'
                                                        : isSelected
                                                            ? `${colors.selected} text-white shadow-md scale-110 border-2 border-white`
                                                            : 'bg-white/80 text-foreground/70 border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md cursor-pointer'
                                                    }
                                                    ${selectedSeats.length >= maxSeats && !isSelected && seat.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {seatLabel(seat.seatNumber)}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Aisle */}
                                <div className="w-4 md:w-6 flex justify-center">
                                    <div className="w-1.5 h-full min-h-[2.25rem] bg-white/40 rounded-full" />
                                </div>

                                {/* Right seats (C, D, ...) */}
                                <div className="flex-1 flex justify-start gap-1.5">
                                    {rowSeats.slice(Math.ceil(rowSeats.length / 2)).map((seat) => {
                                        const isSelected = selectedSeats.includes(seat.id);
                                        const colors = getClassColor(seat.class);
                                        return (
                                            <button
                                                key={seat.id}
                                                disabled={!seat.isAvailable && !isSelected}
                                                onClick={() => handleSeatClick(seat)}
                                                title={`${seat.seatNumber} - ${seat.class}${!seat.isAvailable ? ' (Terisi)' : ''}`}
                                                className={`
                                                    w-9 h-9 md:w-10 md:h-10 rounded-lg text-xs font-bold transition-all duration-200
                                                    ${!seat.isAvailable && !isSelected
                                                        ? 'bg-red-100 text-red-400 cursor-not-allowed border border-red-200'
                                                        : isSelected
                                                            ? `${colors.selected} text-white shadow-md scale-110 border-2 border-white`
                                                            : 'bg-white/80 text-foreground/70 border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md cursor-pointer'
                                                    }
                                                    ${selectedSeats.length >= maxSeats && !isSelected && seat.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {seatLabel(seat.seatNumber)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/80 border-2 border-gray-200" />
                        <span className="text-xs text-foreground/60">Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-sky-500 border-2 border-sky-300" />
                        <span className="text-xs text-foreground/60">Dipilih</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-red-100 border-2 border-red-200" />
                        <span className="text-xs text-foreground/60">Terisi</span>
                    </div>
                </div>
            </div>
        </div>
    );
}