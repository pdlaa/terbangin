export interface ETicketPassenger {
    fullName: string;
    seat?: { seatNumber: string; class?: string } | null;
}

export interface ETicketBooking {
    id?: string;
    bookingCode: string;
    passengerName: string;
    status: string;
    totalPrice?: string;
    flight: {
        flightNumber: string;
        departureTime: string;
        arrivalTime: string;
        airline: {
            name: string;
            code: string;
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
    seat?: { seatNumber: string; class?: string } | null;
    passengers?: ETicketPassenger[];
}

export interface CachedETicket {
    id: string;
    bookingCode: string;
    cachedAt: string;
    booking: ETicketBooking;
    boardingQrPayload: string;
}
