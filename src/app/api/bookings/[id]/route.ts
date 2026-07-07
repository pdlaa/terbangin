import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { refreshBookingStatusIfNeeded } from '@/lib/booking-status';

function serializeBooking(booking: any) {
    return {
        id: booking.id.toString(),
        bookingCode: booking.bookingCode,
        passengerName: booking.passengerName,
        passengerEmail: booking.passengerEmail,
        passengerPhone: booking.passengerPhone,
        flightId: booking.flightId.toString(),
        userId: booking.userId.toString(),
        totalPrice: booking.totalPrice.toString(),
        status: booking.status,
        expiresAt: booking.expiresAt,
        createdAt: booking.createdAt,
        passengers: (booking.passengers || []).map((p: any) => ({
            id: p.id.toString(),
            fullName: p.fullName,
            gender: p.gender,
            birthDate: p.birthDate,
            passportNumber: p.passportNumber,
            seatId: p.seatId ? p.seatId.toString() : null,
            seatNumber: p.seatNumber,
        })),
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login' }, { status: 401 });
        }

        const { id } = await params;
        const bookingId = BigInt(id);
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { 
                passengers: true, 
                flight: { 
                    include: { 
                        airline: true, 
                        departureAirport: true, 
                        arrivalAirport: true 
                    } 
                } 
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
        }

        const effectiveStatus = await refreshBookingStatusIfNeeded({
            id: booking.id,
            status: booking.status,
            flight: booking.flight,
        });

        if (effectiveStatus !== booking.status) {
            booking.status = effectiveStatus;
        }

        const isStaffLike = ['admin', 'staff', 'manager'].includes(session.role);
        if (booking.userId !== BigInt(session.userId) && !isStaffLike) {
            return NextResponse.json({ error: 'Tidak diizinkan melihat booking pengguna lain' }, { status: 403 });
        }

        return NextResponse.json({
            booking: {
                ...serializeBooking(booking),
                flight: {
                    id: booking.flight.id.toString(),
                    flightNumber: booking.flight.flightNumber,
                    departureTime: booking.flight.departureTime,
                    arrivalTime: booking.flight.arrivalTime,
                    airline: booking.flight.airline,
                    departureAirport: booking.flight.departureAirport,
                    arrivalAirport: booking.flight.arrivalAirport,
                },
            },
        });
    } catch (error) {
        console.error('Get booking detail error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}