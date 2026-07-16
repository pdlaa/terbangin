import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const body = await request.json();
        
        // We only allow updating code, name, and airlineId to avoid complex seat recreation logic
        const { code, name, airlineId } = body;

        const updateData: any = {};
        if (code) updateData.code = code;
        if (name) updateData.name = name;
        if (airlineId) updateData.airlineId = BigInt(airlineId);

        const airplane = await prisma.airplane.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        const serializedAirplane = {
            ...airplane,
            airlineId: airplane.airlineId.toString(),
            id: airplane.id.toString(),
        };

        return NextResponse.json(serializedAirplane);
    } catch (error) {
        console.error('Error updating airplane:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                 return NextResponse.json({ error: 'Airplane code already exists' }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Failed to update airplane' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = BigInt(resolvedParams.id);

        // Check if airplane is used in any flights
        const flightCount = await prisma.flight.count({
            where: { airplaneId: id }
        });

        if (flightCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete airplane because it is assigned to one or more flights.' },
                { status: 400 }
            );
        }

        // Delete seats first due to foreign key constraints, then delete airplane
        await prisma.$transaction(async (tx) => {
            await tx.seat.deleteMany({
                where: { airplaneId: id }
            });
            await tx.airplane.delete({
                where: { id: id },
            });
        });

        return NextResponse.json({ message: 'Airplane deleted successfully' });
    } catch (error) {
        console.error('Error deleting airplane:', error);
        return NextResponse.json({ error: 'Failed to delete airplane' }, { status: 500 });
    }
}
