import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id');

        if (!id || !/^\d+$/.test(id)) {
            return NextResponse.json({ error: 'Invalid flight ID' }, { status: 400 });
        }

        const flight = await prisma.flight.findUnique({
            where: { id: BigInt(id) },
            select: {
                id: true,
                flightNumber: true,
                departureTime: true,
                arrivalTime: true,
                duration: true,
                price: true,
                availableSeats: true,
                airline: {
                    select: {
                        code: true,
                        name: true,
                        logo: true,
                    },
                },
                departureAirport: {
                    select: {
                        iataCode: true,
                        city: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                arrivalAirport: {
                    select: {
                        iataCode: true,
                        city: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                airplane: {
                    select: {
                        model: true,
                        registrationNumber: true,
                        capacity: true,
                    },
                },
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
        console.error('Get flight detail error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
