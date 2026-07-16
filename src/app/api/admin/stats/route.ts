import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

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

        const now = new Date();

        // Total flights
        const totalFlights = await prisma.flight.count();

        // Active flights (within next 24 hours)
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const activeFlights = await prisma.flight.count({
            where: {
                departureTime: {
                    gte: now,
                    lte: tomorrow,
                },
                status: 'SCHEDULED',
            },
        });

        // Total passengers
        const totalPassengers = await prisma.passenger.count();

        // Confirmed bookings
        const confirmedBookings = await prisma.booking.count({
            where: { status: 'confirmed' },
        });

        // Expired tickets
        const expiredTickets = await prisma.booking.count({
            where: { status: 'expired' },
        });

        return NextResponse.json({
            totalFlights,
            activeFlights,
            totalPassengers,
            confirmedBookings,
            expiredTickets,
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
