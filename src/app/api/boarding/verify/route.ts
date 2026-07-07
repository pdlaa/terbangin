import { NextRequest, NextResponse } from 'next/server';
import { verifyBoardingQrPayload } from '@/lib/boarding-qr';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isStaffLike = ['admin', 'staff', 'manager'].includes(session.role);
        if (!isStaffLike) {
            return NextResponse.json({ error: 'Hanya staff yang dapat memverifikasi QR boarding' }, { status: 403 });
        }

        const { payload } = await request.json();
        if (!payload || typeof payload !== 'string') {
            return NextResponse.json({ error: 'Payload QR tidak valid' }, { status: 400 });
        }

        const result = verifyBoardingQrPayload(payload);
        if (!result.valid || !result.manifest) {
            return NextResponse.json({ valid: false, error: 'QR tidak valid atau telah dimanipulasi' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { bookingCode: result.manifest.code },
        });

        if (!booking) {
            return NextResponse.json({ valid: false, error: 'Booking tidak ditemukan' }, { status: 404 });
        }

        const bookingStatus = booking.status as string;
        if (bookingStatus !== 'confirmed') {
            return NextResponse.json({
                valid: false,
                error: bookingStatus === 'used'
                    ? 'Tiket sudah digunakan'
                    : bookingStatus === 'expired'
                        ? 'Tiket sudah kadaluarsa'
                        : 'Tiket belum aktif atau sudah dibatalkan',
            }, { status: 400 });
        }

        await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'used' },
        });

        return NextResponse.json({
            valid: true,
            used: true,
            manifest: result.manifest,
        });
    } catch (error) {
        console.error('Verify boarding QR error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
