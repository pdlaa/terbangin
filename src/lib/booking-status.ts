import { prisma } from '@/lib/prisma';

export type EffectiveBookingStatus = 'pending' | 'confirmed' | 'used' | 'expired' | 'cancelled';

export function getBookingStatusFromBooking(booking: { status: string; flight: { departureTime: string | Date } }): EffectiveBookingStatus {
    const status = booking.status as EffectiveBookingStatus;
    const departureTime = new Date(booking.flight.departureTime);
    const now = new Date();

    if (status === 'confirmed' && departureTime.getTime() <= now.getTime()) {
        return 'expired';
    }

    return status;
}

export async function refreshBookingStatusIfNeeded(booking: { id: bigint; status: string; flight: { departureTime: string | Date } }) {
    const currentStatus = booking.status as EffectiveBookingStatus;
    const effectiveStatus = getBookingStatusFromBooking(booking);

    if (effectiveStatus !== currentStatus) {
        await prisma.booking.update({
            where: { id: booking.id },
            data: { status: effectiveStatus },
        });
    }

    return effectiveStatus;
}

export async function expireOverdueBookingsForUser(userId: bigint) {
    const now = new Date();
    await prisma.booking.updateMany({
        where: {
            userId,
            status: 'confirmed',
            flight: {
                departureTime: { lte: now },
            },
        },
        data: { status: 'expired' },
    });
}

export async function expireOverdueBookingsGlobal() {
    const now = new Date();
    await prisma.booking.updateMany({
        where: {
            status: 'confirmed',
            flight: {
                departureTime: { lte: now },
            },
        },
        data: { status: 'expired' },
    });
}
