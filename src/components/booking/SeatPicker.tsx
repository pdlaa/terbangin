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
        const row = seat.seatNumber.replace(/[^0-9]/g, '');
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
    });

    const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));

    const getSeatLetter = (num: string) => num.replace(/[0-9]/g, '');

    const getClassMeta = (cls: string) => {
        switch (cls) {
            case 'economy':
                return {
                    icon: '🛫',
                    label: 'Ekonomi',
                    button: 'bg-sky-500 text-white',
                    chip: 'bg-sky-100 text-sky-700',
                    selected: 'bg-sky-500 text-white border-sky-300',
                    available: 'bg-white/90 text-foreground/70 border-sky-200 hover:bg-sky-50',
                };
            case 'business':
                return {
                    icon: '💼',
                    label: 'Bisnis',
                    button: 'bg-amber-500 text-white',
                    chip: 'bg-amber-100 text-amber-700',
                    selected: 'bg-amber-500 text-white border-amber-300',
                    available: 'bg-white/90 text-foreground/70 border-amber-200 hover:bg-amber-50',
                };
            case 'first':
                return {
                    icon: '👑',
                    label: 'First',
                    button: 'bg-purple-500 text-white',
                    chip: 'bg-purple-100 text-purple-700',
                    selected: 'bg-purple-500 text-white border-purple-300',
                    available: 'bg-white/90 text-foreground/70 border-purple-200 hover:bg-purple-50',
                };
            default:
                return {
                    icon: '🎟️',
                    label: 'Lainnya',
                    button: 'bg-slate-500 text-white',
                    chip: 'bg-slate-100 text-slate-700',
                    selected: 'bg-slate-500 text-white border-slate-300',
                    available: 'bg-white/90 text-foreground/70 border-slate-200 hover:bg-slate-50',
                };
        }
    };

    const selectedSeatInfo = seats.filter((seat) => selectedSeats.includes(seat.id));

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
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
                {['economy', 'business', 'first'].map((cls) => {
                    const count = seats.filter((s) => s.class === cls).length;
                    const available = seats.filter((s) => s.class === cls && s.isAvailable).length;
                    const meta = getClassMeta(cls);
                    return (
                        <button
                            key={cls}
                            onClick={() => setActiveClass(cls)}
                            className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${
                                activeClass === cls
                                    ? `${meta.button} shadow-lg scale-[1.02] border-transparent`
                                    : 'bg-white/60 text-foreground/70 border-white/60 hover:bg-white/80'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span>{meta.icon}</span>
                                <span className="capitalize">{meta.label}</span>
                            </div>
                            <div className="text-xs mt-1 opacity-80">{available}/{count} tersedia</div>
                        </button>
                    );
                })}
            </div>

            <div className="glass-card rounded-3xl border border-white/60 p-5 md:p-7">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                        <h3 className="font-bold text-lg">Denah Kursi</h3>
                        <p className="text-xs text-foreground/60 mt-1">Pilih sampai {maxSeats} kursi untuk penumpang</p>
                    </div>
                    <div className="rounded-full bg-sky/10 px-3 py-1 text-xs font-semibold text-sky">
                        {selectedSeats.length}/{maxSeats} dipilih
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="w-24 h-8 rounded-t-full bg-gradient-to-r from-sky/20 to-cyan/20 border border-white/60 flex items-center justify-center text-[11px] font-semibold text-foreground/60">
                        ✈️ Kokpit
                    </div>
                </div>

                <div className="max-w-xl mx-auto border border-white/40 rounded-3xl bg-white/25 p-3 md:p-4 overflow-x-auto">
                    <div className="min-w-[360px] space-y-2">
                        {sortedRows.map((rowNum) => {
                            const rowSeats = seatsByRow[rowNum].sort((a, b) =>
                                getSeatLetter(a.seatNumber).localeCompare(getSeatLetter(b.seatNumber))
                            );
                            const leftSeats = rowSeats.slice(0, Math.ceil(rowSeats.length / 2));
                            const rightSeats = rowSeats.slice(Math.ceil(rowSeats.length / 2));

                            return (
                                <div key={rowNum} className="flex items-center gap-2">
                                    <div className="w-6 text-xs font-mono text-foreground/40 text-right shrink-0">{rowNum}</div>

                                    <div className="flex-1 flex justify-end gap-1.5">
                                        {leftSeats.map((seat) => {
                                            const isSelected = selectedSeats.includes(seat.id);
                                            const meta = getClassMeta(seat.class);
                                            const isBlocked = !seat.isAvailable && !isSelected;
                                            const isLimitReached = selectedSeats.length >= maxSeats && !isSelected && seat.isAvailable;

                                            return (
                                                <button
                                                    key={seat.id}
                                                    type="button"
                                                    disabled={isBlocked || isLimitReached}
                                                    onClick={() => handleSeatClick(seat)}
                                                    title={`${seat.seatNumber} - ${seat.class}${!seat.isAvailable ? ' (Terisi)' : ''}`}
                                                    className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all duration-200 ${
                                                        isBlocked
                                                            ? 'bg-red-100 text-red-400 cursor-not-allowed border-red-200'
                                                            : isSelected
                                                                ? meta.selected
                                                                : isLimitReached
                                                                    ? 'bg-white/40 text-foreground/40 cursor-not-allowed border-white/50'
                                                                    : meta.available
                                                    }`}
                                                >
                                                    {getSeatLetter(seat.seatNumber)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="w-5 md:w-7 flex justify-center shrink-0">
                                        <div className="w-1.5 h-8 rounded-full bg-white/50" />
                                    </div>

                                    <div className="flex-1 flex justify-start gap-1.5">
                                        {rightSeats.map((seat) => {
                                            const isSelected = selectedSeats.includes(seat.id);
                                            const meta = getClassMeta(seat.class);
                                            const isBlocked = !seat.isAvailable && !isSelected;
                                            const isLimitReached = selectedSeats.length >= maxSeats && !isSelected && seat.isAvailable;

                                            return (
                                                <button
                                                    key={seat.id}
                                                    type="button"
                                                    disabled={isBlocked || isLimitReached}
                                                    onClick={() => handleSeatClick(seat)}
                                                    title={`${seat.seatNumber} - ${seat.class}${!seat.isAvailable ? ' (Terisi)' : ''}`}
                                                    className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all duration-200 ${
                                                        isBlocked
                                                            ? 'bg-red-100 text-red-400 cursor-not-allowed border-red-200'
                                                            : isSelected
                                                                ? meta.selected
                                                                : isLimitReached
                                                                    ? 'bg-white/40 text-foreground/40 cursor-not-allowed border-white/50'
                                                                    : meta.available
                                                    }`}
                                                >
                                                    {getSeatLetter(seat.seatNumber)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/70 px-3 py-1 border border-white/60">Tersedia</span>
                        <span className="rounded-full bg-sky-500 px-3 py-1 text-white">Dipilih</span>
                        <span className="rounded-full bg-red-100 px-3 py-1 text-red-500">Terisi</span>
                    </div>

                    {selectedSeatInfo.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedSeatInfo.map((seat) => (
                                <span key={seat.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${getClassMeta(seat.class).chip}`}>
                                    {seat.seatNumber}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}