import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { verifyBoardingQrPayload } from '@/lib/boarding-qr';
import { generateBoardingQrPayload } from '@/lib/boarding-qr';

const STAFF_LIKE_ROLES = ['admin', 'staff', 'manager'];

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!STAFF_LIKE_ROLES.includes(session.role)) {
            return NextResponse.json(
                { error: 'Hanya staff yang dapat melakukan validasi boarding' },
                { status: 403 }
            );
        }

        const { bookingCode, payload } = await request.json();

        let booking: any = null;
        let manifest: any = null;

        // Path 1: QR Payload decoding
        if (payload && typeof payload === 'string') {
            const result = verifyBoardingQrPayload(payload);
            if (!result.valid || !result.manifest) {
                return NextResponse.json(
                    { error: 'QR Code tidak valid atau telah dimanipulasi' },
                    { status: 400 }
                );
            }
            manifest = result.manifest;

            booking = await prisma.booking.findUnique({
                where: { bookingCode: manifest.code },
                include: {
                    flight: {
                        include: {
                            airline: true,
                            departureAirport: true,
                            arrivalAirport: true,
                        },
                    },
                    passengers: true,
                },
            });
        }
        // Path 2: Manual Booking Code entry
        else if (bookingCode && typeof bookingCode === 'string') {
            booking = await prisma.booking.findUnique({
                where: { bookingCode: bookingCode.trim().toUpperCase() },
                include: {
                    flight: {
                        include: {
                            airline: true,
                            departureAirport: true,
                            arrivalAirport: true,
                        },
                    },
                    passengers: true,
                },
            });

            if (!booking) {
                return NextResponse.json(
                    { error: 'Booking dengan kode tersebut tidak ditemukan' },
                    { status: 404 }
                );
            }

            // Generate manifest from booking data
            const passengers = booking.passengers.length > 0 
                ? booking.passengers 
                : [{ fullName: booking.passengerName, seat: null }];

            manifest = {
                code: booking.bookingCode,
                fn: booking.flight.flightNumber,
                dep: booking.flight.departureAirport.iataCode,
                arr: booking.flight.arrivalAirport.iataCode,
                depAt: booking.flight.departureTime.toISOString(),
                pax: passengers.map((p: any) => ({
                    n: p.fullName,
                    s: p.seatNumber || null,
                })),
            };
        } else {
            return NextResponse.json(
                { error: 'Booking Code atau QR Payload harus disediakan' },
                { status: 400 }
            );
        }

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking tidak ditemukan' },
                { status: 404 }
            );
        }

        const bookingStatus = booking.status as string;

        // Validation checks
        if (bookingStatus === 'pending') {
            return NextResponse.json(
                { error: 'Booking belum dibayar. Status: Pending' },
                { status: 400 }
            );
        }

        if (bookingStatus === 'cancelled') {
            return NextResponse.json(
                { error: 'Booking telah dibatalkan' },
                { status: 400 }
            );
        }

        if (bookingStatus === 'expired') {
            return NextResponse.json(
                { error: 'Tiket sudah hangus/kadaluarsa' },
                { status: 400 }
            );
        }

        if (bookingStatus === 'used') {
            return NextResponse.json(
                { error: 'Tiket sudah digunakan/boarding sudah dilakukan sebelumnya' },
                { status: 400 }
            );
        }

        if (bookingStatus !== 'confirmed') {
            return NextResponse.json(
                { error: `Status booking tidak valid: ${bookingStatus}` },
                { status: 400 }
            );
        }

        // Validate flight departure time
        const now = new Date();
        const flightTime = new Date(booking.flight.departureTime);
        const oneHourBefore = new Date(flightTime.getTime() - 60 * 60 * 1000);

        if (now < oneHourBefore) {
            return NextResponse.json(
                { error: `Check-in belum dibuka. Gate check-in dibuka 1 jam sebelum keberangkatan (${oneHourBefore.toLocaleTimeString('id-ID')})` },
                { status: 400 }
            );
        }

        if (now > flightTime) {
            return NextResponse.json(
                { error: 'Penerbangan sudah berangkat' },
                { status: 400 }
            );
        }

        // Mark booking as used (boarded)
        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'used' },
        });

        return NextResponse.json({
            valid: true,
            used: true,
            manifest,
            message: 'Penumpang berhasil masuk ke pesawat',
        });
    } catch (error: any) {
        console.error('Boarding validation error:', error);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
