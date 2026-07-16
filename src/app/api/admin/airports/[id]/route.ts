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
        const { name, city, country, iataCode, imageUrl, timezone } = body;

        if (!name || !city || !country || !iataCode) {
            return NextResponse.json({ error: 'Field name, city, country, dan iataCode wajib diisi' }, { status: 400 });
        }

        const normalizedIataCode = iataCode.trim().toUpperCase();
        if (normalizedIataCode.length !== 3) {
            return NextResponse.json({ error: 'Kode IATA harus terdiri dari 3 karakter' }, { status: 400 });
        }

        // Check if there is another airport with same IATA code
        const duplicate = await prisma.airport.findFirst({
            where: {
                iataCode: normalizedIataCode,
                id: { not: BigInt(id) },
            },
        });

        if (duplicate) {
            return NextResponse.json({ error: `Bandara dengan kode IATA ${normalizedIataCode} sudah terdaftar` }, { status: 409 });
        }

        const updated = await prisma.airport.update({
            where: { id: BigInt(id) },
            data: {
                name,
                city,
                country,
                iataCode: normalizedIataCode,
                imageUrl: imageUrl || null,
                timezone: timezone || null,
            },
        });

        return NextResponse.json({
            message: 'Bandara berhasil diperbarui',
            airport: {
                ...updated,
                id: updated.id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Update airport error:', error);
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
        const airportId = BigInt(id);

        // Check if airport is linked to flights
        const relatedFlights = await prisma.flight.findFirst({
            where: {
                OR: [
                    { departureAirportId: airportId },
                    { arrivalAirportId: airportId },
                ],
            },
        });

        if (relatedFlights) {
            return NextResponse.json({
                error: 'Bandara tidak dapat dihapus karena sedang digunakan dalam jadwal aktif penerbangan.',
            }, { status: 400 });
        }

        await prisma.airport.delete({
            where: { id: airportId },
        });

        return NextResponse.json({ message: 'Bandara berhasil dihapus' });
    } catch (error: any) {
        console.error('Delete airport error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
