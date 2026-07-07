import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const date = searchParams.get('date');
        const classType = searchParams.get('class') || 'economy';

        console.log('🔍 Search params:', { from, to, date, classType });

        if (!from || !to) {
            return NextResponse.json({ error: 'From and to are required' }, { status: 400 });
        }

        // Cari airport IDs
        const departureAirport = await prisma.airport.findUnique({
            where: { iataCode: from },
            select: { id: true, iataCode: true, city: true },
        });

        const arrivalAirport = await prisma.airport.findUnique({
            where: { iataCode: to },
            select: { id: true, iataCode: true, city: true },
        });

        console.log('✈️ Airports:', {
            departure: departureAirport?.iataCode,
            arrival: arrivalAirport?.iataCode
        });

        if (!departureAirport || !arrivalAirport) {
            return NextResponse.json({
                error: 'Airport not found',
                from,
                to
            }, { status: 404 });
        }

        const whereClause: any = {
            departureAirportId: departureAirport.id,
            arrivalAirportId: arrivalAirport.id,
            status: 'SCHEDULED',
        };

        if (date) {
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            whereClause.departureTime = {
                gte: searchDate,
                lt: nextDay,
            };
        }

        // Count total flights
        const totalFlights = await prisma.flight.count({
            where: whereClause,
        });

        console.log(`📊 Total flights found: ${totalFlights}`);

        const flights = await prisma.flight.findMany({
            where: whereClause,
            include: {
                airline: {
                    select: {
                        code: true,
                        name: true,
                        logo: true,
                    },
                },
                departureAirport: {
                    select: {
                        iataCode: true,
                        name: true,
                        city: true,
                        imageUrl: true,
                    },
                },
                arrivalAirport: {
                    select: {
                        iataCode: true,
                        name: true,
                        city: true,
                        imageUrl: true,
                    },
                },
                airplane: {
                    select: {
                        model: true,
                    },
                },
            },
            orderBy: {
                departureTime: 'asc',
            },
        });

        // ✅ Convert BigInt to String sebelum dikirim ke client
        const serializedFlights = flights.map(flight => ({
            ...flight,
            id: flight.id.toString(),
            airlineId: flight.airlineId.toString(),
            airplaneId: flight.airplaneId.toString(),
            departureAirportId: flight.departureAirportId.toString(),
            arrivalAirportId: flight.arrivalAirportId.toString(),
        }));

        console.log(`✅ Returning ${serializedFlights.length} flights`);

        return NextResponse.json({ flights: serializedFlights });
    } catch (error) {
        console.error('❌ Search flights error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}