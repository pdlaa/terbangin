import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const flight = await prisma.flight.findUnique({
            where: { id: BigInt(id) },
            include: {
                airline: true,
                departureAirport: true,
                arrivalAirport: true,
                airplane: true,
            },
        });

        if (!flight) {
            return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
        }

        return NextResponse.json({
            flight: {
                id: flight.id.toString(),
                flightNumber: flight.flightNumber,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                duration: flight.duration || 120,
                price: flight.price.toString(),
                availableSeats: flight.availableSeats,
                airline: flight.airline,
                departureAirport: flight.departureAirport,
                arrivalAirport: flight.arrivalAirport,
                airplane: flight.airplane,
            },
        });
    } catch (error) {
        console.error('Get flight error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}