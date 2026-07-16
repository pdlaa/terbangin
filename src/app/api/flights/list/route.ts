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

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const flights = await prisma.flight.findMany({
            include: {
                airline: {
                    select: { name: true, code: true },
                },
                departureAirport: {
                    select: { iataCode: true, city: true },
                },
                arrivalAirport: {
                    select: { iataCode: true, city: true },
                },
                airplane: {
                    select: { model: true, capacity: true },
                },
                _count: {
                    select: {
                        bookings: {
                            where: { status: 'confirmed' },
                        },
                    },
                },
            },
            orderBy: { departureTime: 'desc' },
        });

        return NextResponse.json({ flights: serializeBigInt(flights) });
    } catch (error: any) {
        console.error('Error fetching flights:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
