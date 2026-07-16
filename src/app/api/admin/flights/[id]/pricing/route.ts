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
        const { price, priceMultiplierBusiness, priceMultiplierFirst } = body;

        if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return NextResponse.json({ error: 'Harga dasar harus berupa angka positif' }, { status: 400 });
        }

        const multBusiness = priceMultiplierBusiness !== null && priceMultiplierBusiness !== undefined
            ? parseFloat(priceMultiplierBusiness)
            : null;

        const multFirst = priceMultiplierFirst !== null && priceMultiplierFirst !== undefined
            ? parseFloat(priceMultiplierFirst)
            : null;

        if (multBusiness !== null && (isNaN(multBusiness) || multBusiness <= 0)) {
            return NextResponse.json({ error: 'Multiplier Business Class harus berupa angka positif' }, { status: 400 });
        }

        if (multFirst !== null && (isNaN(multFirst) || multFirst <= 0)) {
            return NextResponse.json({ error: 'Multiplier First Class harus berupa angka positif' }, { status: 400 });
        }

        const updated = await prisma.flight.update({
            where: { id: flightId },
            data: {
                price: parseFloat(price).toFixed(2),
                priceMultiplierBusiness: multBusiness,
                priceMultiplierFirst: multFirst,
            },
        });

        return NextResponse.json({
            message: 'Harga penerbangan berhasil diperbarui',
            flight: {
                id: updated.id.toString(),
                price: updated.price.toString(),
                priceMultiplierBusiness: updated.priceMultiplierBusiness ? Number(updated.priceMultiplierBusiness) : null,
                priceMultiplierFirst: updated.priceMultiplierFirst ? Number(updated.priceMultiplierFirst) : null,
            },
        });
    } catch (error: any) {
        console.error('Update flight pricing error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
