import crypto from 'crypto';
import type { ETicketBooking } from '@/lib/offline/types';

interface BoardingManifest {
    v: number;
    code: string;
    fn: string;
    dep: string;
    arr: string;
    depAt: string;
    pax: Array<{ n: string; s: string | null }>;
}

export function generateBoardingQrPayload(booking: ETicketBooking): string {
    const passengers =
        booking.passengers && booking.passengers.length > 0
            ? booking.passengers
            : [{ fullName: booking.passengerName, seat: booking.seat || null }];

    const manifest: BoardingManifest = {
        v: 1,
        code: booking.bookingCode,
        fn: booking.flight.flightNumber,
        dep: booking.flight.departureAirport.iataCode,
        arr: booking.flight.arrivalAirport.iataCode,
        depAt: String(booking.flight.departureTime),
        pax: passengers.map((p) => ({
            n: p.fullName,
            s: p.seat?.seatNumber || null,
        })),
    };

    const secret = process.env.BOARDING_QR_SECRET || process.env.JWT_SECRET || 'terbangin-boarding';
    const sig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(manifest))
        .digest('hex')
        .substring(0, 20);

    const payload = { ...manifest, sig };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function verifyBoardingQrPayload(encoded: string): { valid: boolean; manifest?: BoardingManifest & { sig: string } } {
    try {
        const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        const { sig, ...manifest } = decoded;
        const secret = process.env.BOARDING_QR_SECRET || process.env.JWT_SECRET || 'terbangin-boarding';
        const expected = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(manifest))
            .digest('hex')
            .substring(0, 20);

        return { valid: sig === expected, manifest: decoded };
    } catch {
        return { valid: false };
    }
}
