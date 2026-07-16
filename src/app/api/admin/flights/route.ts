import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            airlineId,
            airplaneId,
            departureAirportId,
            arrivalAirportId,
            flightNumber,
            departureTime,
            arrivalTime,
            price,
            duration,
        } = body;

        if (
            !airlineId ||
            !airplaneId ||
            !departureAirportId ||
            !arrivalAirportId ||
            !flightNumber ||
            !departureTime ||
            !arrivalTime ||
            !price
        ) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
        }

        // Fetch airplane capacity to set availableSeats
        const airplane = await prisma.airplane.findUnique({
            where: { id: BigInt(airplaneId) },
            select: { capacity: true },
        });

        if (!airplane) {
            return NextResponse.json({ error: 'Pesawat tidak ditemukan' }, { status: 404 });
        }

        const flight = await prisma.flight.create({
            data: {
                airlineId: BigInt(airlineId),
                airplaneId: BigInt(airplaneId),
                departureAirportId: BigInt(departureAirportId),
                arrivalAirportId: BigInt(arrivalAirportId),
                flightNumber: flightNumber.trim().toUpperCase(),
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                price: parseFloat(price).toFixed(2),
                availableSeats: airplane.capacity,
                status: 'SCHEDULED',
                duration: duration ? parseInt(duration, 10) : null,
            },
        });

        return NextResponse.json({
            message: 'Jadwal penerbangan berhasil ditambahkan',
            flight: {
                ...flight,
                id: flight.id.toString(),
                airlineId: flight.airlineId.toString(),
                airplaneId: flight.airplaneId.toString(),
                departureAirportId: flight.departureAirportId.toString(),
                arrivalAirportId: flight.arrivalAirportId.toString(),
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create flight error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
