'use client';

import { useRouter } from 'next/navigation';

interface FlightCardProps {
    flight: {
        id: string;
        flightNumber: string;
        departureTime: string;
        arrivalTime: string;
        duration: number;
        price: any;
        availableSeats: number;
        airline: {
            code: string;
            name: string;
            logo: string | null;
        };
        departureAirport: {
            iataCode: string;
            city: string;
            name: string;
            imageUrl?: string | null;
        };
        arrivalAirport: {
            iataCode: string;
            city: string;
            name: string;
            imageUrl?: string | null;
        };
        airplane: {
            model: string;
        };
    };
}

export default function FlightCard({ flight }: FlightCardProps) {
    const router = useRouter();

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}j ${mins > 0 ? mins + 'm' : ''}`;
    };

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(parseFloat(price));
    };

    // Emoji mapping untuk setiap maskapai
    const getAirlineEmoji = (code: string) => {
        const emojis: Record<string, string> = {
            'GA': '🦅',
            'JT': '🦁',
            'QG': '🛩️',
            'ID': '🎨',
            'QZ': '🌏',
            'SQ': '🇸🇬',
            'MH': '🇲🇾',
            'TG': '🇹🇭',
        };
        return emojis[code] || '✈️';
    };

    const imageUrl = flight.arrivalAirport.imageUrl || flight.departureAirport.imageUrl;

    return (
        <div
            className="glass-card-hover p-6 cursor-pointer overflow-hidden"
            onClick={() => router.push(`/customer/booking/${flight.id}`)}
        >
            {imageUrl && (
                <div
                    className="mb-6 h-40 rounded-3xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Airline Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky to-cyan flex items-center justify-center text-white text-2xl shadow-glow">
                        {getAirlineEmoji(flight.airline.code)}
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{flight.airline.name}</div>
                        <div className="text-sm text-foreground/60">{flight.flightNumber}</div>
                    </div>
                </div>

                {/* Flight Route */}
                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                    {/* Departure */}
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{formatDate(flight.departureTime)}</div>
                        <div className="text-sm text-foreground/60">{flight.departureAirport.iataCode}</div>
                        <div className="text-xs text-foreground/40">{flight.departureAirport.city}</div>
                    </div>

                    {/* Duration */}
                    <div className="text-center">
                        <div className="text-sm font-semibold text-sky">{formatDuration(flight.duration)}</div>
                        <div className="text-xs text-foreground/40">Direct</div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{formatDate(flight.arrivalTime)}</div>
                        <div className="text-sm text-foreground/60">{flight.arrivalAirport.iataCode}</div>
                        <div className="text-xs text-foreground/40">{flight.arrivalAirport.city}</div>
                    </div>
                </div>

                {/* Price & Seats */}
                <div className="text-right">
                    <div className="text-2xl font-bold gradient-text mb-1">{formatPrice(flight.price)}</div>
                    <div className="text-sm text-foreground/60 mb-3">{flight.availableSeats} kursi tersedia</div>
                    <button className="glass-button px-6 py-2 text-sm ripple">
                        Pilih Penerbangan
                    </button>
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-foreground/10 flex items-center justify-between text-sm text-foreground/60">
                <div>{formatDate(flight.departureTime)}</div>
                <div>{flight.airplane.model}</div>
                <div>Bagasi 20kg</div>
            </div>
        </div>
    );
}