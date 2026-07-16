import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || !['admin', 'staff'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const airplaneId = searchParams.get('airplaneId');

        if (!airplaneId) {
            return NextResponse.json({ error: 'airplaneId required' }, { status: 400 });
        }

        const seats = await prisma.seat.findMany({
            where: { airplaneId: BigInt(airplaneId) },
            orderBy: { seatNumber: 'asc' },
        });

        const serialized = seats.map((s) => ({
            id: s.id.toString(),
            airplaneId: s.airplaneId.toString(),
            seatNumber: s.seatNumber,
            class: s.class,
        }));

        return NextResponse.json({ seats: serialized });
    } catch (error: any) {
        console.error('Error fetching seats:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { action, airplaneId, seatNumber, seatClass, rows, columns } = body;

        // Action: BULK GENERATE
        if (action === 'generate') {
            if (!airplaneId || !rows || !columns || !Array.isArray(columns)) {
                return NextResponse.json({ error: 'airplaneId, rows, and columns are required for generation' }, { status: 400 });
            }

            const parsedAirplaneId = BigInt(airplaneId);
            const airplane = await prisma.airplane.findUnique({
                where: { id: parsedAirplaneId },
            });

            if (!airplane) {
                return NextResponse.json({ error: 'Airplane tidak ditemukan' }, { status: 404 });
            }

            // Create seat layout rows
            const seatsToCreate = [];
            for (let row = 1; row <= parseInt(rows, 10); row++) {
                for (const col of columns) {
                    // Let first 2 rows be first class, rows 3-7 be business class, rest economy
                    let sClass: 'first' | 'business' | 'economy' = 'economy';
                    if (row <= 2) sClass = 'first';
                    else if (row <= 7) sClass = 'business';

                    seatsToCreate.push({
                        airplaneId: parsedAirplaneId,
                        seatNumber: `${row}${col}`,
                        class: sClass,
                    });
                }
            }

            // Delete old seats first to regenerate cleanly
            await prisma.seat.deleteMany({
                where: { airplaneId: parsedAirplaneId },
            });

            const result = await prisma.seat.createMany({
                data: seatsToCreate,
                skipDuplicates: true,
            });

            // Update airplane capacity to match generated seats
            await prisma.airplane.update({
                where: { id: parsedAirplaneId },
                data: { capacity: result.count },
            });

            return NextResponse.json({
                message: `Berhasil membuat ${result.count} kursi kustom`,
                count: result.count,
            });
        }

        // Action: CREATE SINGLE SEAT
        if (!airplaneId || !seatNumber || !seatClass) {
            return NextResponse.json({ error: 'airplaneId, seatNumber, and seatClass are required' }, { status: 400 });
        }

        const parsedAirplaneId = BigInt(airplaneId);
        const existing = await prisma.seat.findFirst({
            where: {
                airplaneId: parsedAirplaneId,
                seatNumber: seatNumber.trim().toUpperCase(),
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Nomor kursi sudah terdaftar di pesawat ini' }, { status: 400 });
        }

        const seat = await prisma.seat.create({
            data: {
                airplaneId: parsedAirplaneId,
                seatNumber: seatNumber.trim().toUpperCase(),
                class: seatClass,
            },
        });

        // Increment airplane capacity
        await prisma.airplane.update({
            where: { id: parsedAirplaneId },
            data: { capacity: { increment: 1 } },
        });

        return NextResponse.json({
            message: 'Kursi berhasil ditambahkan',
            seat: {
                id: seat.id.toString(),
                airplaneId: seat.airplaneId.toString(),
                seatNumber: seat.seatNumber,
                class: seat.class,
            },
        });
    } catch (error: any) {
        console.error('Error creating seat:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id, seatClass } = body;

        if (!id || !seatClass) {
            return NextResponse.json({ error: 'id and seatClass are required' }, { status: 400 });
        }

        const seatId = BigInt(id);
        const updated = await prisma.seat.update({
            where: { id: seatId },
            data: { class: seatClass },
        });

        return NextResponse.json({
            message: 'Kelas kursi berhasil diubah',
            seat: {
                id: updated.id.toString(),
                seatNumber: updated.seatNumber,
                class: updated.class,
            },
        });
    } catch (error: any) {
        console.error('Error updating seat:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const seatId = BigInt(id);

        const seat = await prisma.seat.findUnique({
            where: { id: seatId },
        });

        if (!seat) {
            return NextResponse.json({ error: 'Kursi tidak ditemukan' }, { status: 404 });
        }

        await prisma.seat.delete({
            where: { id: seatId },
        });

        // Decrement airplane capacity
        await prisma.airplane.update({
            where: { id: seat.airplaneId },
            data: { capacity: { decrement: 1 } },
        });

        return NextResponse.json({ message: 'Kursi berhasil dihapus' });
    } catch (error: any) {
        console.error('Error deleting seat:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
