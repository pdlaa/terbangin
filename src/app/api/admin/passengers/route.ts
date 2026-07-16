import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { serializeBigInt } from '@/utils/serialize';

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAllowed = ['admin', 'staff'].includes(session.role);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const flightId = searchParams.get('flightId');

        if (!flightId) {
            return NextResponse.json({ error: 'flightId required' }, { status: 400 });
        }

        // Get all passengers for this flight
        const passengers = await prisma.passenger.findMany({
            where: {
                flightId: BigInt(flightId),
            },
            include: {
                booking: {
                    select: {
                        status: true,
                        passengerEmail: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Map to response format
        const passengerList = passengers.map((p) => ({
            id: p.id.toString(),
            bookingId: p.bookingId.toString(),
            fullName: p.fullName,
            gender: p.gender,
            birthDate: p.birthDate.toISOString(),
            passportNumber: p.passportNumber,
            email: p.booking.passengerEmail || '',
            seatNumber: p.seatNumber || null,
            bookingStatus: p.booking.status,
        }));

        return NextResponse.json({ passengers: passengerList });
    } catch (error: any) {
        console.error('Error fetching passengers:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
