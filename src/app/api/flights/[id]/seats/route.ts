import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Flight ID tidak valid' }, { status: 400 });
    }
    const flightId = BigInt(id);

    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        airplane: {
          include: {
            seats: true,
          },
        },
      },
    });

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    // Occupancy is scoped to THIS flight only. A seat belongs to an
    // Airplane, and the same Airplane serves many Flights at different
    // dates/times, so we must never treat "this seat has a passenger
    // somewhere" as "this seat is taken on this flight". We also ignore
    // `pending` bookings whose payment window has already expired.
    const now = new Date();
    const takenPassengers = await prisma.passenger.findMany({
      where: {
        flightId,
        seatId: { not: null },
        booking: {
          OR: [
            { status: 'confirmed' },
            { status: 'pending', expiresAt: { gt: now } },
          ],
        },
      },
      select: { seatId: true },
    });
    
    // Clean and type-safe filtering of seat ids to prevent TypeScript errors
    const takenSeatIds = new Set(
      takenPassengers
        .filter((p) => p.seatId !== null && p.seatId !== undefined)
        .map((p) => p.seatId!.toString())
    );

    const seatsWithAvailability = flight.airplane.seats
      .map((seat) => ({
        id: seat.id.toString(),
        seatNumber: seat.seatNumber,
        class: seat.class,
        isAvailable: !takenSeatIds.has(seat.id.toString()),
      }))
      .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));

    if (seatsWithAvailability.length === 0) {
      // This airplane has no seat layout in the database at all — not a
      // request error, but bad/incomplete data. Run `npm run db:fix-seats`
      // to backfill a standard layout for any airplane missing one.
      console.warn(
        `[seats] Airplane ${flight.airplane.model} (id=${flight.airplaneId}) used by flight ${id} has no seats configured.`
      );
    }

    return NextResponse.json({
      seats: seatsWithAvailability,
      airplane: {
        model: flight.airplane.model,
        // Guard against BigInt Serialization error if capacity is saved as BigInt in DB
        capacity: typeof flight.airplane.capacity === 'bigint' 
          ? Number(flight.airplane.capacity) 
          : flight.airplane.capacity,
      },
    });
  } catch (error) {
    console.error('Get seats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}