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

        const airlines = await prisma.airline.findMany({
            orderBy: { name: 'asc' },
        });

        const serializedAirlines = airlines.map((airline) => ({
            ...airline,
            id: airline.id.toString(),
        }));

        return NextResponse.json({ airlines: serializedAirlines });
    } catch (error: any) {
        console.error('List airlines error:', error);
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
        const { name, code, logo, description } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Field name dan code wajib diisi' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();

        // Check unique code
        const existing = await prisma.airline.findUnique({
            where: { code: normalizedCode },
        });

        if (existing) {
            return NextResponse.json({ error: `Maskapai dengan kode ${normalizedCode} sudah terdaftar` }, { status: 409 });
        }

        const airline = await prisma.airline.create({
            data: {
                name,
                code: normalizedCode,
                logo: logo || null,
                description: description || null,
            },
        });

        return NextResponse.json({
            message: 'Maskapai berhasil ditambahkan',
            airline: {
                ...airline,
                id: airline.id.toString(),
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create airline error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
