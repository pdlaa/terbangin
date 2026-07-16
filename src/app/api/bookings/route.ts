import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { AppError } from '@/lib/api-errors';
import { createBookingSchema } from '@/lib/validations/booking';
import { expireOverdueBookingsForUser } from '@/lib/booking-status';

const PAYMENT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function generateBookingCode(): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TB${Date.now().toString(36).toUpperCase()}${rand}`;
}

function seatPriceMultiplier(seatClass: string, flight: any): number {
    if (seatClass === 'business') return Number(flight.priceMultiplierBusiness || 1.5);
    if (seatClass === 'first') return Number(flight.priceMultiplierFirst || 2);
    return 1;
}

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

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login' }, { status: 401 });
        }

        const requestedUserId = request.nextUrl.searchParams.get('userId');
        const isStaffLike = ['admin', 'staff', 'manager'].includes(session.role);

        let targetUserId = session.userId;
        if (requestedUserId && requestedUserId !== session.userId) {
            if (!isStaffLike) {
                return NextResponse.json({ error: 'Tidak diizinkan melihat booking pengguna lain' }, { status: 403 });
            }
            targetUserId = requestedUserId;
        }

        await expireOverdueBookingsForUser(BigInt(targetUserId));

        const bookings = await prisma.booking.findMany({
            where: { userId: BigInt(targetUserId) },
            include: { passengers: true, flight: { include: { airline: true, departureAirport: true, arrivalAirport: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            bookings: bookings.map((b) => ({
                ...serializeBooking(b),
                flight: {
                    id: b.flight.id.toString(),
                    flightNumber: b.flight.flightNumber,
                    departureTime: b.flight.departureTime,
                    arrivalTime: b.flight.arrivalTime,
                    airline: b.flight.airline,
                    departureAirport: b.flight.departureAirport,
                    arrivalAirport: b.flight.arrivalAirport,
                },
            })),
        });
    } catch (error) {
        console.error('List bookings error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login untuk melakukan booking' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({ where: { id: BigInt(session.userId) } });
        if (!currentUser) {
            return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
        }
        if (!currentUser.emailVerifiedAt) {
            return NextResponse.json(
                { error: 'Verifikasi email Anda terlebih dahulu sebelum melakukan booking' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = createBookingSchema.safeParse(body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return NextResponse.json(
                { error: firstIssue?.message || 'Data booking tidak valid', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { flightId, contactEmail, contactPhone, passengers } = parsed.data;
        const flightIdBig = BigInt(flightId);
        const passengerCount = passengers.length;
        const now = new Date();

        const booking = await prisma.$transaction(
            async (tx) => {
                const flight = await tx.flight.findUnique({ where: { id: flightIdBig } });
                if (!flight) throw new AppError('Penerbangan tidak ditemukan', 404);
                if (flight.status === 'cancelled') throw new AppError('Penerbangan ini telah dibatalkan', 400);
                if (flight.departureTime.getTime() <= now.getTime()) {
                    throw new AppError('Penerbangan ini sudah berangkat dan tidak dapat dipesan', 400);
                }

                const seatIds = passengers.map((p) => BigInt(p.seatId));

                const seatRecords = await tx.seat.findMany({ where: { id: { in: seatIds } } });
                if (seatRecords.length !== new Set(seatIds.map(String)).size) {
                    throw new AppError('Salah satu kursi yang dipilih tidak ditemukan', 400);
                }
                const seatMap = new Map(seatRecords.map((s) => [s.id.toString(), s]));
                for (const seat of seatRecords) {
                    if (seat.airplaneId !== flight.airplaneId) {
                        throw new AppError('Kursi yang dipilih tidak sesuai dengan pesawat penerbangan ini', 400);
                    }
                }

                const conflicting = await tx.passenger.findMany({
                    where: {
                        flightId: flightIdBig,
                        seatId: { in: seatIds },
                        booking: {
                            OR: [
                                { status: 'confirmed' },
                                { status: 'pending', expiresAt: { gt: now } },
                            ],
                        },
                    },
                    select: { seatId: true },
                });
                if (conflicting.length > 0) {
                    throw new AppError(
                        'Salah satu kursi yang Anda pilih baru saja dipesan orang lain. Silakan pilih kursi lain.',
                        409
                    );
                }

                const decremented = await tx.flight.updateMany({
                    where: { id: flightIdBig, availableSeats: { gte: passengerCount } },
                    data: { availableSeats: { decrement: passengerCount } },
                });
                if (decremented.count === 0) {
                    throw new AppError('Kursi yang tersedia tidak mencukupi untuk jumlah penumpang ini', 400);
                }

                const bookingCode = generateBookingCode();
                const expiresAt = new Date(now.getTime() + PAYMENT_WINDOW_MS);

                const totalPrice = passengers.reduce((sum, p) => {
                    const seat = seatMap.get(p.seatId)!;
                    return sum + Number(flight.price) * seatPriceMultiplier(seat.class, flight);
                }, 0);

                const created = await tx.booking.create({
                    data: {
                        userId: BigInt(session.userId),
                        flightId: flightIdBig,
                        bookingCode,
                        passengerName: passengers[0].fullName,
                        passengerEmail: contactEmail,
                        passengerPhone: contactPhone,
                        totalPrice,
                        status: 'pending',
                        expiresAt,
                        passengers: {
                            create: passengers.map((p) => {
                                const seat = seatMap.get(p.seatId)!;
                                return {
                                    flightId: flightIdBig,
                                    seatId: seat.id,
                                    fullName: p.fullName,
                                    gender: p.gender,
                                    birthDate: new Date(p.birthDate),
                                    passportNumber: p.passportNumber.toUpperCase(),
                                    seatNumber: seat.seatNumber,
                                };
                            }),
                        },
                        payment: {
                            create: {
                                userId: BigInt(session.userId),
                                amount: totalPrice,
                                paymentStatus: 'pending',
                                transactionCode: bookingCode,
                            },
                        },
                    },
                    include: { passengers: true, payment: true },
                });

                return created;
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                maxWait: 10000,
                timeout: 15000,
            }
        );

        return NextResponse.json(
            {
                message: 'Booking berhasil dibuat',
                booking: serializeBooking(booking),
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: 'Salah satu kursi yang dipilih sudah terisi. Silakan pilih kursi lain.' },
                { status: 409 }
            );
        }
        console.error('Create booking error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}