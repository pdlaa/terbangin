'use client';

import { useState, useEffect } from 'react';

interface FlightFiltersProps {
    onFilterChange: (filters: {
        maxPrice: number;
        airlines: string[];
        departureTime: string;
        stops: string;
    }) => void;
}

export default function FlightFilters({ onFilterChange }: FlightFiltersProps) {
    const [maxPrice, setMaxPrice] = useState(5000000);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [departureTime, setDepartureTime] = useState<string>('');
    const [stops, setStops] = useState<string>('');

    // Trigger onFilterChange when any filter changes
    useEffect(() => {
        onFilterChange({
            maxPrice,
            airlines: selectedAirlines,
            departureTime,
            stops
        });
    }, [maxPrice, selectedAirlines, departureTime, stops]);

    const handleAirlineChange = (airlineName: string, checked: boolean) => {
        if (checked) {
            setSelectedAirlines([...selectedAirlines, airlineName]);
        } else {
            setSelectedAirlines(selectedAirlines.filter(a => a !== airlineName));
        }
    };

    const handleReset = () => {
        setMaxPrice(5000000);
        setSelectedAirlines([]);
        setDepartureTime('');
        setStops('');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Filter Penerbangan</h3>
                <button
                    onClick={handleReset}
                    className="text-xs text-sky font-bold hover:underline"
                >
                    Reset All
                </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Harga Maksimum</label>
                <input
                    type="range"
                    min="500000"
                    max="5000000"
                    step="100000"
                    value={maxPrice}
                    className="w-full accent-sky"
                    onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between text-xs text-foreground/60 mt-1 font-semibold">
                    <span>Rp 500rb</span>
                    <span className="text-sky font-bold">{formatCurrency(maxPrice)}</span>
                </div>
            </div>

            {/* Airlines */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Maskapai</label>
                <div className="space-y-2">
                    {[
                        { label: 'Garuda Indonesia', val: 'Garuda Indonesia' },
                        { label: 'Lion Air', val: 'Lion Air' },
                        { label: 'Citilink', val: 'Citilink' },
                        { label: 'Batik Air', val: 'Batik Air' },
                        { label: 'AirAsia', val: 'Indonesia AirAsia' } // Maps visual AirAsia label to DB's Indonesia AirAsia value
                    ].map((airline) => (
                        <label key={airline.val} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedAirlines.includes(airline.val)}
                                onChange={(e) => handleAirlineChange(airline.val, e.target.checked)}
                                className="rounded border-gray-300 text-sky focus:ring-sky/30"
                            />
                            <span className="text-sm text-foreground/80">{airline.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Departure Time */}
            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Waktu Keberangkatan</label>
                <div className="space-y-2">
                    {[
                        { label: 'Semua Waktu', value: '' },
                        { label: 'Pagi (06:00 - 12:00)', value: 'pagi' },
                        { label: 'Siang (12:00 - 18:00)', value: 'siang' },
                        { label: 'Malam (18:00 - 24:00)', value: 'malam' }
                    ].map((time) => (
                        <label key={time.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="departureTime"
                                checked={departureTime === time.value}
                                onChange={() => setDepartureTime(time.value)}
                                className="border-gray-300 text-sky focus:ring-sky/30"
                            />
                            <span className="text-sm text-foreground/80">{time.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Stops */}
            <div>
                <label className="block text-sm font-semibold mb-2">Jumlah Transit</label>
                <div className="space-y-2">
                    {[
                        { label: 'Semua Transit', value: '' },
                        { label: 'Direct Only', value: 'direct' },
                        { label: '1 Transit', value: '1' },
                        { label: '2+ Transit', value: '2' }
                    ].map((stop) => (
                        <label key={stop.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="stops"
                                checked={stops === stop.value}
                                onChange={() => setStops(stop.value)}
                                className="border-gray-300 text-sky focus:ring-sky/30"
                            />
                            <span className="text-sm text-foreground/80">{stop.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}