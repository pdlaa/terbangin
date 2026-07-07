'use client';

interface Seat {
    id: string;
    seatNumber: string;
    class: string;
    isAvailable: boolean;
}

interface SeatSelectionProps {
    seats: Seat[];
    selectedSeats: string[];
    maxSeats: number;
    onToggleSeat: (seatId: string) => void;
}

export default function SeatSelection({ seats, selectedSeats, maxSeats, onToggleSeat }: SeatSelectionProps) {
    const businessSeats = seats.filter((s) => s.class === 'business');
    const firstSeats = seats.filter((s) => s.class === 'first');
    const economySeats = seats.filter((s) => s.class === 'economy');

    const renderSeat = (seat: Seat) => {
        const isSelected = selectedSeats.includes(seat.id);
        const isAvailable = seat.isAvailable;
        const selectionOrder = isSelected ? selectedSeats.indexOf(seat.id) + 1 : null;
        const limitReached = !isSelected && selectedSeats.length >= maxSeats;

        let seatClass = 'bg-gray-200 cursor-not-allowed text-gray-400';
        if (isAvailable) {
            if (isSelected) {
                seatClass = 'bg-gradient-to-br from-sky to-cyan text-white shadow-glow scale-110';
            } else if (limitReached) {
                seatClass = 'bg-white/40 text-foreground/40 cursor-not-allowed';
            } else {
                seatClass = 'bg-white/70 hover:bg-sky/20 cursor-pointer';
            }
        }

        return (
            <button
                key={seat.id}
                type="button"
                disabled={!isAvailable || limitReached}
                onClick={() => isAvailable && onToggleSeat(seat.id)}
                title={seat.seatNumber}
                className={`relative w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-300 ${seatClass}`}
            >
                {seat.seatNumber}
                {selectionOrder && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-warm text-white text-[10px] flex items-center justify-center">
                        {selectionOrder}
                    </span>
                )}
            </button>
        );
    };

    // Splits a row's seat letters into two groups with an aisle gap in the
    // middle, the way a real cabin is laid out (e.g. ABC | DEF, or ABCD | EFGH).
    const renderSeatGroup = (groupSeats: Seat[], label: string, badgeClass: string) => {
        if (groupSeats.length === 0) return null;
        const rows = Array.from(new Set(groupSeats.map((s) => parseInt(s.seatNumber, 10)))).sort((a, b) => a - b);

        return (
            <div className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${badgeClass}`}>{label}</span>
                </div>
                <div className="rounded-xl bg-white/20 p-4">
                    <div className="flex flex-col items-center gap-2">
                        {rows.map((rowNumber) => {
                            const rowSeats = groupSeats
                                .filter((s) => s.seatNumber.startsWith(rowNumber.toString()))
                                .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));
                            const mid = Math.ceil(rowSeats.length / 2);
                            const left = rowSeats.slice(0, mid);
                            const right = rowSeats.slice(mid);

                            return (
                                <div key={rowNumber} className="flex items-center gap-3">
                                    <span className="w-5 text-[11px] font-semibold text-foreground/40 text-right shrink-0">
                                        {rowNumber}
                                    </span>
                                    <div className="flex gap-1.5">{left.map(renderSeat)}</div>
                                    {/* Aisle */}
                                    <div className="w-5 shrink-0" />
                                    <div className="flex gap-1.5">{right.map(renderSeat)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Pilih Kursi</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky/10 text-sky">
                    {selectedSeats.length}/{maxSeats} dipilih
                </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/70 border border-foreground/20"></div>
                    <span>Tersedia</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky to-cyan"></div>
                    <span>Dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-200"></div>
                    <span>Terisi</span>
                </div>
            </div>

            {seats.length === 0 ? (
                <p className="text-sm text-foreground/50 text-center py-8">
                    Denah kursi tidak tersedia untuk penerbangan ini.
                </p>
            ) : (
                <div className="max-h-[520px] overflow-y-auto pr-1 -mr-1">
                    {renderSeatGroup(firstSeats, 'First Class · +100%', 'bg-warm/15 text-warm')}
                    {renderSeatGroup(businessSeats, 'Business Class · +50%', 'bg-violet-500/10 text-violet-600')}
                    {renderSeatGroup(economySeats, 'Economy Class', 'bg-sky/10 text-sky')}
                </div>
            )}
        </div>
    );
}
