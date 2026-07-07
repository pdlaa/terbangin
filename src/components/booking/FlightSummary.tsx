interface FlightSummaryProps {
    flight: {
        id: string;
        flightNumber: string;
        departureTime: string;
        arrivalTime: string;
        duration: number;
        price: any;
        airline: {
            code: string;
            name: string;
        };
        departureAirport: {
            iataCode: string;
            city: string;
            name: string;
        };
        arrivalAirport: {
            iataCode: string;
            city: string;
            name: string;
        };
    };
}

export default function FlightSummary({ flight }: FlightSummaryProps) {
    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(parseFloat(price));
    };

    return (
        <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-4">Detail Penerbangan</h3>

            <div className="space-y-4">
                {/* Airline */}
                <div className="flex items-center gap-3 pb-4 border-b border-foreground/10">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky to-cyan flex items-center justify-center text-white font-bold">
                        {flight.airline.code}
                    </div>
                    <div>
                        <div className="font-semibold">{flight.airline.name}</div>
                        <div className="text-sm text-foreground/60">{flight.flightNumber}</div>
                    </div>
                </div>

                {/* Route */}
                <div className="grid grid-cols-3 gap-4 items-center py-4 border-b border-foreground/10">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">{formatTime(flight.departureTime)}</div>
                        <div className="text-sm text-foreground/60">{flight.departureAirport.iataCode}</div>
                        <div className="text-xs text-foreground/40">{flight.departureAirport.city}</div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm font-semibold text-sky">{flight.duration} menit</div>
                        <div className="text-xs text-foreground/40">Direct</div>
                        <div className="w-full h-0.5 bg-gradient-to-r from-sky/30 to-cyan/30 mt-2"></div>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">{formatTime(flight.arrivalTime)}</div>
                        <div className="text-sm text-foreground/60">{flight.arrivalAirport.iataCode}</div>
                        <div className="text-xs text-foreground/40">{flight.arrivalAirport.city}</div>
                    </div>
                </div>

                {/* Date */}
                <div className="py-2">
                    <div className="text-sm text-foreground/60">{formatDate(flight.departureTime)}</div>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
                    <span className="text-foreground/60">Harga per penumpang</span>
                    <span className="text-2xl font-bold gradient-text">{formatPrice(flight.price)}</span>
                </div>
            </div>
        </div>
    );
}