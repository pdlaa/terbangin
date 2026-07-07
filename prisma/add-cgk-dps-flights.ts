import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding CGK → DPS flights...');

    // Get airports
    const cgk = await prisma.airport.findUnique({ where: { iataCode: 'CGK' } });
    const dps = await prisma.airport.findUnique({ where: { iataCode: 'DPS' } });

    if (!cgk || !dps) {
        console.error('Airport not found!');
        return;
    }

    // Get first Garuda airplane
    const garuda = await prisma.airline.findUnique({ where: { code: 'GA' } });
    const airplane = await prisma.airplane.findFirst({
        where: { airlineId: garuda?.id }
    });

    if (!airplane) {
        console.error('Airplane not found!');
        return;
    }

    // Create 10 flights for next 10 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 10; i++) {
        const departureTime = new Date(today);
        departureTime.setDate(departureTime.getDate() + i);
        departureTime.setHours(6 + (i * 2), 0, 0); // 6:00, 8:00, 10:00, etc.

        const arrivalTime = new Date(departureTime);
        arrivalTime.setHours(departureTime.getHours() + 2); // 2 hours flight

        await prisma.flight.create({
            data: {
                airlineId: airplane.airlineId,
                airplaneId: airplane.id,
                departureAirportId: cgk.id,
                arrivalAirportId: dps.id,
                flightNumber: `GA${100 + i}`,
                departureTime,
                arrivalTime,
                price: (800000 + (i * 50000)).toFixed(2),
                availableSeats: 150 - (i * 5),
                status: 'SCHEDULED',
                duration: 120,
            },
        });
    }

    console.log('✅ Created 10 flights CGK → DPS');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });