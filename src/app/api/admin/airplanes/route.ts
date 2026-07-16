import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || !['admin', 'manager'].includes(session.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const airplanes = await prisma.airplane.findMany({
            include: {
                airline: true,
                _count: {
                    select: { flights: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Convert BigInt to string for JSON serialization
        const serializedAirplanes = airplanes.map(plane => ({
            ...plane,
            airline: plane.airline ? {
                ...plane.airline,
                id: plane.airline.id.toString(),
            } : null,
            id: plane.id.toString(),
            airlineId: plane.airlineId.toString(),
        }));

        return NextResponse.json({ airplanes: serializedAirplanes });
    } catch (error) {
        console.error('Error fetching airplanes:', error);
        return NextResponse.json({ error: 'Failed to fetch airplanes' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { airlineId, model, capacity, registrationNumber, description } = body;

        if (!model || !capacity || !airlineId) {
            return NextResponse.json({ error: 'Model, capacity, dan airlineId wajib diisi' }, { status: 400 });
        }

        const totalCapacity = parseInt(capacity, 10);
        if (isNaN(totalCapacity) || totalCapacity <= 0) {
            return NextResponse.json({ error: 'Kapasitas harus berupa angka positif' }, { status: 400 });
        }

        // Use a transaction to create the airplane and its seats
        const result = await prisma.$transaction(async (tx) => {
            const newAirplane = await tx.airplane.create({
                data: {
                    model,
                    registrationNumber: registrationNumber || null,
                    capacity: totalCapacity,
                    description: description || null,
                    airlineId: BigInt(airlineId),
                }
            });

            // Generate seats based on capacity
            const seatsToCreate: Prisma.SeatCreateManyInput[] = [];
            const cols = totalCapacity < 200 
                ? ['A', 'B', 'C', 'D', 'E', 'F'] 
                : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            
            const businessRows = totalCapacity < 200 ? 4 : 5;
            let seatsGenerated = 0;
            let row = 1;

            while (seatsGenerated < totalCapacity) {
                for (const col of cols) {
                    if (seatsGenerated >= totalCapacity) break;
                    
                    const isBusiness = row <= businessRows;
                    seatsToCreate.push({
                        airplaneId: newAirplane.id,
                        seatNumber: `${row}${col}`,
                        class: isBusiness ? 'business' : 'economy',
                    });
                    seatsGenerated++;
                }
                row++;
            }

            if (seatsToCreate.length > 0) {
                await tx.seat.createMany({
                    data: seatsToCreate
                });
            }

            return newAirplane;
        });

        // Convert BigInt to string for JSON serialization
        const serializedResult = {
            ...result,
            airlineId: result.airlineId.toString(),
            id: result.id.toString(),
        };

        return NextResponse.json({
            message: 'Pesawat berhasil ditambahkan beserta denah kursi',
            airplane: serializedResult
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating airplane:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json({ error: 'Nomor registrasi pesawat sudah terdaftar' }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Failed to create airplane' }, { status: 500 });
    }
}
