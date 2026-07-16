import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAllowed = ['admin', 'staff'].includes(session.role);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const bookingId = BigInt(id);

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { flight: true },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Data pemesanan tidak ditemukan' }, { status: 404 });
        }

        if (booking.status !== 'confirmed') {
            return NextResponse.json(
                { error: `Hanya tiket berstatus CONFIRMED yang dapat di-checkin. Status tiket saat ini: ${booking.status.toUpperCase()}` },
                { status: 400 }
            );
        }

        // Update status to 'used' (Boarded / Checkin Complete)
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'used',
            },
        });

        return NextResponse.json({
            message: 'Berhasil melakukan konfirmasi check-in penumpang',
            booking: {
                id: updatedBooking.id.toString(),
                status: updatedBooking.status,
            },
        });
    } catch (error: any) {
        console.error('Admin check-in error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
