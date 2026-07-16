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
        const body = await request.json();
        const { name, code, logo, description } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Field name dan code wajib diisi' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();

        const duplicate = await prisma.airline.findFirst({
            where: {
                code: normalizedCode,
                id: { not: BigInt(id) },
            },
        });

        if (duplicate) {
            return NextResponse.json({ error: `Maskapai dengan kode ${normalizedCode} sudah terdaftar` }, { status: 409 });
        }

        const updated = await prisma.airline.update({
            where: { id: BigInt(id) },
            data: {
                name,
                code: normalizedCode,
                logo: logo || null,
                description: description || null,
            },
        });

        return NextResponse.json({
            message: 'Maskapai berhasil diperbarui',
            airline: {
                ...updated,
                id: updated.id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Update airline error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(
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
        const airlineId = BigInt(id);

        // Check if airline has related airplanes
        const relatedAirplanes = await prisma.airplane.findFirst({
            where: { airlineId },
        });

        if (relatedAirplanes) {
            return NextResponse.json({
                error: 'Maskapai tidak dapat dihapus karena memiliki armada pesawat aktif.',
            }, { status: 400 });
        }

        // Check if airline has related flights
        const relatedFlights = await prisma.flight.findFirst({
            where: { airlineId },
        });

        if (relatedFlights) {
            return NextResponse.json({
                error: 'Maskapai tidak dapat dihapus karena memiliki jadwal penerbangan aktif.',
            }, { status: 400 });
        }

        await prisma.airline.delete({
            where: { id: airlineId },
        });

        return NextResponse.json({ message: 'Maskapai berhasil dihapus' });
    } catch (error: any) {
        console.error('Delete airline error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
