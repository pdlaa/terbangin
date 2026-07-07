import { prisma } from '@/lib/prisma';
import { sendBookingConfirmationEmail } from '@/services/mail/mailer';

export interface PaymentUpdateParams {
    orderId: string;
    transactionStatus: string;
    transactionId?: string;
    paymentMethod?: string;
    fraudStatus?: string;
}

export async function processPaymentNotification(params: PaymentUpdateParams): Promise<{
    action: 'confirmed' | 'cancelled' | 'pending' | 'ignored';
    bookingId?: string;
}> {
    const { orderId, transactionStatus, transactionId, paymentMethod, fraudStatus } = params;

    const booking = await prisma.booking.findUnique({
        where: { bookingCode: orderId },
        include: {
            payment: true,
            passengers: true,
            flight: {
                include: {
                    airline: true,
                    departureAirport: true,
                    arrivalAirport: true,
                },
            },
        },
    });

    if (!booking) {
        return { action: 'ignored' };
    }

    if (booking.status === 'confirmed') {
        return { action: 'ignored', bookingId: booking.id.toString() };
    }

    const success =
        transactionStatus === 'settlement' ||
        (transactionStatus === 'capture' && fraudStatus === 'accept');

    const failed = ['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus);

    if (success) {
        if (booking.expiresAt < new Date() && booking.status === 'pending') {
            await cancelBookingAndReleaseSeats(booking.id);
            return { action: 'cancelled', bookingId: booking.id.toString() };
        }

        await confirmBookingPayment({
            bookingId: booking.id,
            transactionId: transactionId || orderId,
            paymentMethod: paymentMethod || 'midtrans',
        });

        await sendBookingConfirmationEmail({
            email: booking.passengerEmail,
            name: booking.passengerName,
            bookingCode: booking.bookingCode,
            bookingId: booking.id.toString(),
            flightNumber: booking.flight.flightNumber,
            airlineName: booking.flight.airline.name,
            departureCity: booking.flight.departureAirport.city,
            arrivalCity: booking.flight.arrivalAirport.city,
            departureTime: booking.flight.departureTime,
            totalPrice: booking.totalPrice.toString(),
        }).catch((err) => console.error('Failed to send confirmation email:', err));

        return { action: 'confirmed', bookingId: booking.id.toString() };
    }

    if (failed && booking.status === 'pending') {
        await cancelBookingAndReleaseSeats(booking.id);
        return { action: 'cancelled', bookingId: booking.id.toString() };
    }

    return { action: 'pending', bookingId: booking.id.toString() };
}

async function confirmBookingPayment(params: {
    bookingId: bigint;
    transactionId: string;
    paymentMethod: string;
}) {
    await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({ where: { id: params.bookingId } });
        if (!booking || booking.status === 'confirmed') return;

        await tx.booking.update({
            where: { id: params.bookingId },
            data: { status: 'confirmed' },
        });

        await tx.payment.update({
            where: { bookingId: params.bookingId },
            data: {
                paymentStatus: 'paid',
                paymentMethod: params.paymentMethod,
                transactionCode: params.transactionId,
                paidAt: new Date(),
            },
        });
    });
}

export async function cancelBookingAndReleaseSeats(bookingId: bigint) {
    await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { passengers: true, payment: true },
        });

        if (!booking || booking.status !== 'pending') return;

        const passengerCount = booking.passengers.length;

        await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'cancelled' },
        });

        if (booking.payment) {
            await tx.payment.update({
                where: { bookingId },
                data: { paymentStatus: 'failed' },
            });
        }

        if (passengerCount > 0) {
            await tx.flight.update({
                where: { id: booking.flightId },
                data: { availableSeats: { increment: passengerCount } },
            });
        }
    });
}
