'use client';

interface FlightFiltersProps {
    onFilterChange: (filters: any) => void;
}

export default function FlightFilters({ onFilterChange }: FlightFiltersProps) {
    return (
        <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-4">Filter Penerbangan</h3>

            {/* Price Range */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Harga Maksimum</label>
                <input
                    type="range"
                    min="500000"
                    max="5000000"
                    step="100000"
                    className="w-full"
                    onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
                />
                <div className="flex justify-between text-sm text-foreground/60 mt-1">
                    <span>Rp 500rb</span>
                    <span>Rp 5jt</span>
                </div>
            </div>

            {/* Airlines */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Maskapai</label>
                <div className="space-y-2">
                    {['Garuda Indonesia', 'Lion Air', 'Citilink', 'Batik Air', 'AirAsia'].map((airline) => (
                        <label key={airline} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-gray-300" />
                            <span className="text-sm">{airline}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Departure Time */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Waktu Keberangkatan</label>
                <div className="space-y-2">
                    {['Pagi (06:00 - 12:00)', 'Siang (12:00 - 18:00)', 'Malam (18:00 - 24:00)'].map((time) => (
                        <label key={time} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="departureTime" className="rounded border-gray-300" />
                            <span className="text-sm">{time}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Stops */}
            <div>
                <label className="block text-sm font-semibold mb-2">Jumlah Transit</label>
                <div className="space-y-2">
                    {['Direct Only', '1 Transit', '2+ Transit'].map((stop) => (
                        <label key={stop} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="stops" className="rounded border-gray-300" />
                            <span className="text-sm">{stop}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}