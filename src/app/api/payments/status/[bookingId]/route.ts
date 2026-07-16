import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import {
    getTransactionStatus,
    isPaymentFailed,
    isPaymentSuccess,
} from '@/services/payment/midtrans';
import { processPaymentNotification, cancelBookingAndReleaseSeats } from '@/lib/payment-handlers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ bookingId: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Anda harus login' }, { status: 401 });
        }

        const { bookingId: bookingIdParam } = await params;

        if (!bookingIdParam || !/^\d+$/.test(bookingIdParam)) {
            return NextResponse.json({ error: 'Booking ID tidak valid' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: BigInt(bookingIdParam) },
            include: { payment: true },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
        }

        if (booking.userId.toString() !== session.userId) {
            return NextResponse.json({ error: 'Anda tidak memiliki akses ke booking ini' }, { status: 403 });
        }

        if (booking.status === 'confirmed') {
            return NextResponse.json({
                bookingStatus: 'confirmed',
                paymentStatus: 'paid',
                message: 'Pembayaran sudah dikonfirmasi',
            });
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json({
                bookingStatus: 'cancelled',
                paymentStatus: booking.payment?.paymentStatus || 'failed',
                message: 'Booking telah dibatalkan',
            });
        }

        const midtransStatus = await getTransactionStatus(booking.bookingCode);

        if (isPaymentSuccess(midtransStatus.transaction_status, midtransStatus.fraud_status)) {
            const result = await processPaymentNotification({
                orderId: midtransStatus.order_id,
                transactionStatus: midtransStatus.transaction_status,
                transactionId: midtransStatus.transaction_id,
                paymentMethod: midtransStatus.payment_type,
                fraudStatus: midtransStatus.fraud_status,
            });

            return NextResponse.json({
                bookingStatus: result.action === 'confirmed' ? 'confirmed' : booking.status,
                paymentStatus: result.action === 'confirmed' ? 'paid' : 'pending',
                message: 'Pembayaran berhasil diverifikasi',
            });
        }

        if (isPaymentFailed(midtransStatus.transaction_status)) {
            await processPaymentNotification({
                orderId: midtransStatus.order_id,
                transactionStatus: midtransStatus.transaction_status,
                transactionId: midtransStatus.transaction_id,
                paymentMethod: midtransStatus.payment_type,
            });

            return NextResponse.json({
                bookingStatus: 'cancelled',
                paymentStatus: 'failed',
                message: 'Pembayaran gagal atau kadaluarsa',
            });
        }

        if (booking.expiresAt < new Date()) {
            await cancelBookingAndReleaseSeats(booking.id);
            return NextResponse.json({
                bookingStatus: 'cancelled',
                paymentStatus: 'failed',
                message: 'Batas waktu pembayaran telah habis',
            });
        }

        if (isPaymentFailed(midtransStatus.transaction_status)) {
            await processPaymentNotification({
                orderId: midtransStatus.order_id,
                transactionStatus: midtransStatus.transaction_status,
                transactionId: midtransStatus.transaction_id,
                paymentMethod: midtransStatus.payment_type,
            });

            return NextResponse.json({
                bookingStatus: 'cancelled',
                paymentStatus: 'failed',
                message: 'Pembayaran gagal atau kadaluarsa',
            });
        }

        return NextResponse.json({
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            midtransStatus: midtransStatus.transaction_status,
            message: 'Pembayaran masih menunggu konfirmasi',
        });
    } catch (error: any) {
        console.error('Check payment status error:', error);

        if (error.message?.includes('404') || error.message?.includes("doesn't exist")) {
            return NextResponse.json({
                bookingStatus: 'pending',
                paymentStatus: 'pending',
                message: 'Belum ada transaksi pembayaran untuk booking ini',
            });
        }

        return NextResponse.json(
            { error: error.message || 'Gagal mengecek status pembayaran' },
            { status: 500 }
        );
    }
}
