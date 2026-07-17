import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q')?.trim() || '';

        if (q.length < 1) {
            return NextResponse.json({ airports: [] });
        }

        const airports = await prisma.airport.findMany({
            where: {
                OR: [
                    { city: { contains: q } },
                    { name: { contains: q } },
                    { iataCode: { contains: q.toUpperCase() } },
                ],
            },
            select: {
                id: true,
                iataCode: true,
                name: true,
                city: true,
                country: true,
                imageUrl: true,
            },
            take: 10,
            orderBy: [{ city: 'asc' }],
        });

        const serialized = airports.map((a: { id: { toString: () => string } }) => ({
            ...a,
            id: a.id.toString(),
        }));

        return NextResponse.json({ airports: serialized });
    } catch (error) {
        console.error('Airport search error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}