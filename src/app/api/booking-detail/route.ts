import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { generateBoardingQrPayload } from '@/lib/boarding-qr';
import { refreshBookingStatusIfNeeded } from '@/lib/booking-status';

const STAFF_LIKE_ROLES = ['admin', 'staff', 'manager'];

export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id');

        if (!id || !/^\d+$/.test(id)) {
            return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
        }

        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: BigInt(id) },
            include: {
                flight: {
                    select: {
                        id: true,
                        flightNumber: true,
                        departureTime: true,
                        arrivalTime: true,
                        duration: true,
                        price: true,
                        airline: {
                            select: {
                                code: true,
                                name: true,
                            },
                        },
                        departureAirport: {
                            select: {
                                iataCode: true,
                                city: true,
                                name: true,
                            },
                        },
                        arrivalAirport: {
                            select: {
                                iataCode: true,
                                city: true,
                                name: true,
                            },
                        },
                    },
                },
                passengers: {
                    include: {
                        seat: {
                            select: {
                                id: true,
                                seatNumber: true,
                                class: true,
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isOwner = booking.userId.toString() === session.userId;
        if (!isOwner && !STAFF_LIKE_ROLES.includes(session.role)) {
            return NextResponse.json({ error: 'Anda tidak memiliki akses ke booking ini' }, { status: 403 });
        }

        const passengers = booking.passengers.map((p) => ({
            id: p.id.toString(),
            fullName: p.fullName,
            gender: p.gender,
            birthDate: p.birthDate,
            passportNumber: p.passportNumber,
            seat: p.seat
                ? { id: p.seat.id.toString(), seatNumber: p.seat.seatNumber, class: p.seat.class }
                : null,
        }));

        const effectiveStatus = await refreshBookingStatusIfNeeded({
            id: booking.id,
            status: booking.status,
            flight: booking.flight,
        });

        if (effectiveStatus !== booking.status) {
            booking.status = effectiveStatus;
        }

        const ticketBooking = {
            id: booking.id.toString(),
            bookingCode: booking.bookingCode,
            passengerName: booking.passengerName,
            passengerEmail: booking.passengerEmail,
            passengerPhone: booking.passengerPhone,
            totalPrice: booking.totalPrice.toString(),
            status: booking.status,
            expiresAt: booking.expiresAt.toISOString(),
            flightId: booking.flightId.toString(),
            userId: booking.userId.toString(),
            createdAt: booking.createdAt.toISOString(),
            flight: {
                id: booking.flight.id.toString(),
                flightNumber: booking.flight.flightNumber,
                departureTime: booking.flight.departureTime.toISOString(),
                arrivalTime: booking.flight.arrivalTime.toISOString(),
                duration: booking.flight.duration || 120,
                price: booking.flight.price.toString(),
                airline: booking.flight.airline,
                departureAirport: booking.flight.departureAirport,
                arrivalAirport: booking.flight.arrivalAirport,
            },
            seat: passengers.length > 0 ? passengers[0].seat : null,
            passengers,
        };

        const boardingQrPayload =
            booking.status === 'confirmed' ? generateBoardingQrPayload(ticketBooking) : '';

        return NextResponse.json({
            booking: ticketBooking,
            boardingQrPayload,
        });
    } catch (error) {
        console.error('Get booking detail error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
