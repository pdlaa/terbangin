import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const airports = await prisma.airport.findMany({
            orderBy: { city: 'asc' },
        });

        const serializedAirports = airports.map((airport) => ({
            ...airport,
            id: airport.id.toString(),
        }));

        return NextResponse.json({ airports: serializedAirports });
    } catch (error: any) {
        console.error('List airports error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, city, country, iataCode, imageUrl, timezone } = body;

        if (!name || !city || !country || !iataCode) {
            return NextResponse.json({ error: 'Field name, city, country, dan iataCode wajib diisi' }, { status: 400 });
        }

        const normalizedIataCode = iataCode.trim().toUpperCase();
        if (normalizedIataCode.length !== 3) {
            return NextResponse.json({ error: 'Kode IATA harus terdiri dari 3 karakter' }, { status: 400 });
        }

        // Check unique iataCode
        const existing = await prisma.airport.findUnique({
            where: { iataCode: normalizedIataCode },
        });

        if (existing) {
            return NextResponse.json({ error: `Bandara dengan kode IATA ${normalizedIataCode} sudah terdaftar` }, { status: 409 });
        }

        const airport = await prisma.airport.create({
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
            message: 'Bandara berhasil ditambahkan',
            airport: {
                ...airport,
                id: airport.id.toString(),
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create airport error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
