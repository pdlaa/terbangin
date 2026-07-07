import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { createSnapToken } from '@/services/payment/midtrans';
import { cancelBookingAndReleaseSeats } from '@/lib/payment-handlers';

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login' }, { status: 401 });
        }

        const body = await request.json();
        const bookingId = body.bookingId;

        if (!bookingId || !/^\d+$/.test(String(bookingId))) {
            return NextResponse.json({ error: 'Booking ID tidak valid' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: BigInt(bookingId) },
            include: { payment: true },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
        }

        if (booking.userId.toString() !== session.userId) {
            return NextResponse.json({ error: 'Anda tidak memiliki akses ke booking ini' }, { status: 403 });
        }

        if (booking.status === 'confirmed') {
            return NextResponse.json({ error: 'Booking ini sudah dibayar' }, { status: 400 });
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json({ error: 'Booking ini sudah dibatalkan' }, { status: 400 });
        }

        if (booking.expiresAt < new Date()) {
            await cancelBookingAndReleaseSeats(booking.id);
            return NextResponse.json(
                { error: 'Batas waktu pembayaran telah habis. Silakan buat booking baru.' },
                { status: 410 }
            );
        }

        const snap = await createSnapToken({
            orderId: booking.bookingCode,
            grossAmount: Number(booking.totalPrice),
            customerName: booking.passengerName,
            customerEmail: booking.passengerEmail,
            customerPhone: booking.passengerPhone || undefined,
        });

        return NextResponse.json({
            snapToken: snap.token,
            redirectUrl: snap.redirect_url,
            orderId: booking.bookingCode,
        });
    } catch (error: any) {
        console.error('Create snap token error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal membuat token pembayaran' },
            { status: 500 }
        );
    }
}
