import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const flightId = BigInt(id);

        const body = await request.json();
        const { availableSeats } = body;

        if (availableSeats === undefined || availableSeats === null || isNaN(parseInt(availableSeats, 10)) || parseInt(availableSeats, 10) < 0) {
            return NextResponse.json({ error: 'Kuota kursi harus berupa angka positif atau nol' }, { status: 400 });
        }

        const newQuota = parseInt(availableSeats, 10);

        // Fetch flight detail with airplane capacity to validate
        const flight = await prisma.flight.findUnique({
            where: { id: flightId },
            include: {
                airplane: { select: { capacity: true } }
            }
        });

        if (!flight) {
            return NextResponse.json({ error: 'Penerbangan tidak ditemukan' }, { status: 404 });
        }

        if (newQuota > flight.airplane.capacity) {
            return NextResponse.json({
                error: `Kuota kursi (${newQuota}) tidak boleh melebihi kapasitas pesawat (${flight.airplane.capacity})`
            }, { status: 400 });
        }

        const updated = await prisma.flight.update({
            where: { id: flightId },
            data: {
                availableSeats: newQuota,
            },
        });

        return NextResponse.json({
            message: 'Kuota kursi berhasil diperbarui',
            flight: {
                id: updated.id.toString(),
                availableSeats: updated.availableSeats,
            },
        });
    } catch (error: any) {
        console.error('Update flight capacity error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
