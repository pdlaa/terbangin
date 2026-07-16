import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
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
            status,
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

        const flightId = BigInt(id);

        // Optional: if airplane changes, recalculate availableSeats?
        const currentFlight = await prisma.flight.findUnique({
            where: { id: flightId },
            select: { airplaneId: true, availableSeats: true },
        });

        if (!currentFlight) {
            return NextResponse.json({ error: 'Penerbangan tidak ditemukan' }, { status: 404 });
        }

        let nextAvailableSeats = currentFlight.availableSeats;
        const nextAirplaneId = BigInt(airplaneId);
        if (nextAirplaneId !== currentFlight.airplaneId) {
            // Airplane changed, get new airplane capacity
            const newAirplane = await prisma.airplane.findUnique({
                where: { id: nextAirplaneId },
                select: { capacity: true },
            });
            if (!newAirplane) {
                return NextResponse.json({ error: 'Pesawat baru tidak ditemukan' }, { status: 404 });
            }
            nextAvailableSeats = newAirplane.capacity;
        }

        const updated = await prisma.flight.update({
            where: { id: flightId },
            data: {
                airlineId: nextAirplaneId === BigInt(airplaneId) ? BigInt(airlineId) : BigInt(airlineId),
                airplaneId: nextAirplaneId,
                departureAirportId: BigInt(departureAirportId),
                arrivalAirportId: BigInt(arrivalAirportId),
                flightNumber: flightNumber.trim().toUpperCase(),
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                price: parseFloat(price).toFixed(2),
                availableSeats: nextAvailableSeats,
                duration: duration ? parseInt(duration, 10) : null,
                status: status || 'SCHEDULED',
            },
        });

        return NextResponse.json({
            message: 'Jadwal penerbangan berhasil diperbarui',
            flight: {
                ...updated,
                id: updated.id.toString(),
                airlineId: updated.airlineId.toString(),
                airplaneId: updated.airplaneId.toString(),
                departureAirportId: updated.departureAirportId.toString(),
                arrivalAirportId: updated.arrivalAirportId.toString(),
            },
        });
    } catch (error: any) {
        console.error('Update flight error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const flightId = BigInt(id);

        // Check if there are active bookings
        const activeBooking = await prisma.booking.findFirst({
            where: {
                flightId,
                status: { in: ['confirmed', 'pending'] },
            },
        });

        if (activeBooking) {
            return NextResponse.json({
                error: 'Penerbangan tidak dapat dihapus karena memiliki pemesanan aktif yang terkonfirmasi atau tertunda.',
            }, { status: 400 });
        }

        await prisma.flight.delete({
            where: { id: flightId },
        });

        return NextResponse.json({ message: 'Penerbangan berhasil dihapus' });
    } catch (error: any) {
        console.error('Delete flight error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
