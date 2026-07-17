import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fetchDestinationImageUrl } from '../src/services/image/destination.ts';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Users (Admin, Manager, Staff, Customer)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    const users = [
        { email: 'admin@terbangin.com', name: 'Admin Terbangin', password: adminPassword, role: 'admin' as const },
        { email: 'manager@terbangin.com', name: 'Manager Terbangin', password: managerPassword, role: 'manager' as const },
        { email: 'staff@terbangin.com', name: 'Staff Terbangin', password: staffPassword, role: 'staff' as const },
        { email: 'customer@terbangin.com', name: 'Customer Test', password: customerPassword, role: 'customer' as const },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                ...user,
                emailVerifiedAt: new Date(),
            },
        });
    }
    console.log(`✅ Created ${users.length} users (admin, manager, staff, customer)`);

    // 2. Create Airports
    const airports = [
        { iataCode: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'DPS', name: 'Ngurah Rai International Airport', city: 'Bali', country: 'Indonesia', timezone: 'Asia/Makassar' },
        { iataCode: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'UPG', name: 'Sultan Hasanuddin Airport', city: 'Makassar', country: 'Indonesia', timezone: 'Asia/Makassar' },
        { iataCode: 'MES', name: 'Kualanamu International Airport', city: 'Medan', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'BTH', name: 'Hang Nadim Airport', city: 'Batam', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'PDG', name: 'Minangkabau International Airport', city: 'Padang', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'PLM', name: 'Sultan Mahmud Badaruddin II Airport', city: 'Palembang', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'BDO', name: 'Husein Sastranegara Airport', city: 'Bandung', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'SRG', name: 'Ahmad Yani Airport', city: 'Semarang', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'JOG', name: 'Adisutcipto Airport', city: 'Yogyakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
        { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
        { iataCode: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
        { iataCode: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
        { iataCode: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
        { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
        { iataCode: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
        { iataCode: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
        { iataCode: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
        { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
    ];

    const createdAirports = [];
    for (const airport of airports) {
        const imageUrl = await fetchDestinationImageUrl(`${airport.city} ${airport.country}`);

        const created = await prisma.airport.upsert({
            where: { iataCode: airport.iataCode },
            update: imageUrl ? { imageUrl } : {},
            create: {
                ...airport,
                imageUrl,
            },
        });
        createdAirports.push(created);
    }
    console.log(`✅ Created ${createdAirports.length} airports`);

    // 3. Create Airlines (dengan emoji sebagai logo fallback)
    const airlines = [
        { code: 'GA', name: 'Garuda Indonesia', logo: null, emoji: '🦅' },
        { code: 'JT', name: 'Lion Air', logo: null, emoji: '🦁' },
        { code: 'QG', name: 'Citilink', logo: null, emoji: '🛩️' },
        { code: 'ID', name: 'Batik Air', logo: null, emoji: '🎨' },
        { code: 'QZ', name: 'Indonesia AirAsia', logo: null, emoji: '🌏' },
        { code: 'SQ', name: 'Singapore Airlines', logo: null, emoji: '🇸🇬' },
        { code: 'MH', name: 'Malaysia Airlines', logo: null, emoji: '🇲🇾' },
        { code: 'TG', name: 'Thai Airways', logo: null, emoji: '🇹🇭' },
    ];

    const createdAirlines = [];
    for (const airline of airlines) {
        const created = await prisma.airline.upsert({
            where: { code: airline.code },
            update: {},
            create: {
                code: airline.code,
                name: airline.name,
                logo: airline.logo,
            },
        });
        createdAirlines.push(created);
    }
    console.log(`✅ Created ${airlines.length} airlines`);

    // 4. Create Airplanes
    const airplanes = [];
    for (let i = 0; i < 20; i++) {
        const airline = createdAirlines[i % createdAirlines.length];
        const airplane = await prisma.airplane.create({
            data: {
                model: ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300', 'Airbus A330'][i % 4],
                capacity: [160, 180, 350, 290][i % 4],
                registrationNumber: `PK-${String.fromCharCode(65 + (i % 26))}${1000 + i}`,
                airline: {
                    connect: { id: airline.id }
                }
            },
        });
        airplanes.push(airplane);
    }
    console.log(`✅ Created ${airplanes.length} airplanes`);

    // 5. Create Seats for each airplane
    for (const airplane of airplanes) {
        const seats = [];
        const seatConfig = airplane.capacity < 200
            ? { rows: 20, cols: ['A', 'B', 'C', 'D', 'E', 'F'], class: 'economy' as const }
            : { rows: 30, cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], class: 'economy' as const };

        for (let row = 1; row <= seatConfig.rows; row++) {
            for (const col of seatConfig.cols) {
                seats.push({
                    airplaneId: airplane.id,
                    seatNumber: `${row}${col}`,
                    class: row <= 5 ? ('business' as const) : seatConfig.class,
                });
            }
        }

        await prisma.seat.createMany({
            data: seats as any,
            skipDuplicates: true,
        });
    }
    console.log('✅ Created seats for all airplanes');

    // 6. Create Random Flights
    const flights = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 120; i++) {
        const departureAirport = createdAirports[i % createdAirports.length];
        const arrivalAirport = createdAirports[(i + 5) % createdAirports.length];
        const airline = createdAirlines[i % createdAirlines.length];
        const airplane = airplanes[i % airplanes.length];

        if (departureAirport.iataCode === arrivalAirport.iataCode) continue;

        const departureTime = new Date(today);
        departureTime.setDate(today.getDate() + (i % 30));
        departureTime.setHours(6 + (i % 12), (i % 4) * 15, 0);

        const arrivalTime = new Date(departureTime);
        arrivalTime.setHours(departureTime.getHours() + 2 + (i % 3));

        const flight = await prisma.flight.create({
            data: {
                flightNumber: `${airline.code}${100 + i}`,
                departureTime,
                arrivalTime,
                price: (500000 + (i % 20) * 100000).toFixed(2),
                availableSeats: airplane.capacity - (i % 20),
                status: 'SCHEDULED',
                duration: 120 + (i % 120),
                airline: { connect: { id: airline.id } },
                airplane: { connect: { id: airplane.id } },
                departureAirport: { connect: { id: departureAirport.id } },
                arrivalAirport: { connect: { id: arrivalAirport.id } }
            },
        });
        flights.push(flight);
    }
    console.log(`✅ Created ${flights.length} random flights`);

    // 7. Create Popular Routes (CGK-DPS, CGK-SUB, dll)
    console.log('🌱 Creating popular routes...');

    const popularRoutes = [
        { from: 'CGK', to: 'DPS', basePrice: 800000 },
        { from: 'CGK', to: 'SUB', basePrice: 600000 },
        { from: 'CGK', to: 'UPG', basePrice: 1200000 },
        { from: 'CGK', to: 'MES', basePrice: 900000 },
        { from: 'CGK', to: 'SIN', basePrice: 1500000 },
        { from: 'DPS', to: 'CGK', basePrice: 850000 },
        { from: 'SUB', to: 'CGK', basePrice: 650000 },
        { from: 'CGK', to: 'JOG', basePrice: 550000 },
        { from: 'CGK', to: 'BDO', basePrice: 500000 },
        { from: 'CGK', to: 'BTH', basePrice: 450000 },
    ];

    let popularFlightsCount = 0;

    for (const route of popularRoutes) {
        const departureAirport = createdAirports.find(a => a.iataCode === route.from);
        const arrivalAirport = createdAirports.find(a => a.iataCode === route.to);

        if (!departureAirport || !arrivalAirport) continue;

        // Create 5 flights per route for next 5 days
        for (let i = 0; i < 5; i++) {
            const airline = createdAirlines[i % createdAirlines.length];
            const airplane = airplanes[i % airplanes.length];

            const departureTime = new Date(today);
            departureTime.setDate(today.getDate() + i);
            departureTime.setHours(6 + (i * 3), 0, 0); // 6:00, 9:00, 12:00, 15:00, 18:00

            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(departureTime.getHours() + 2); // 2 hours flight

            await prisma.flight.create({
                data: {
                    flightNumber: `${airline.code}${300 + popularFlightsCount}`,
                    departureTime,
                    arrivalTime,
                    price: (route.basePrice + (i * 50000)).toFixed(2),
                    availableSeats: airplane.capacity - (i * 10),
                    status: 'SCHEDULED',
                    duration: 120,
                    airline: { connect: { id: airline.id } },
                    airplane: { connect: { id: airplane.id } },
                    departureAirport: { connect: { id: departureAirport.id } },
                    arrivalAirport: { connect: { id: arrivalAirport.id } }
                },
            });
            popularFlightsCount++;
        }
    }

    console.log(`✅ Created ${popularFlightsCount} popular route flights`);

    // 8. Create EXTRA flights for CGK-DPS (3 flights per day for 30 days)
    console.log('🌱 Creating extra CGK-DPS flights for next 30 days...');

    const cgk = createdAirports.find(a => a.iataCode === 'CGK')!;
    const dps = createdAirports.find(a => a.iataCode === 'DPS')!;
    let extraFlightsCount = 0;

    for (let day = 0; day < 30; day++) {
        const flightDate = new Date(today);
        flightDate.setDate(flightDate.getDate() + day);

        // 3 flights per day: morning (6:00), afternoon (12:00), evening (18:00)
        for (let time = 0; time < 3; time++) {
            const departureTime = new Date(flightDate);
            departureTime.setHours([6, 12, 18][time], 0, 0);

            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(departureTime.getHours() + 2);

            const airline = createdAirlines[time % createdAirlines.length];
            const airplane = airplanes[time % airplanes.length];

            await prisma.flight.create({
                data: {
                    flightNumber: `${airline.code}${500 + extraFlightsCount}`,
                    departureTime,
                    arrivalTime,
                    price: (800000 + (time * 100000) + (day * 10000)).toFixed(2),
                    availableSeats: airplane.capacity - 20,
                    status: 'SCHEDULED',
                    duration: 120,
                    airline: { connect: { id: airline.id } },
                    airplane: { connect: { id: airplane.id } },
                    departureAirport: { connect: { id: cgk.id } },
                    arrivalAirport: { connect: { id: dps.id } },
                },
            });
            extraFlightsCount++;
        }
    }

    console.log(`✅ Created ${extraFlightsCount} extra CGK-DPS flights`);

    console.log('🎉 Seed completed!');
    console.log('\n📋 Popular routes available:');
    popularRoutes.forEach(route => {
        console.log(`   ${route.from} → ${route.to} (5 flights)`);
    });
    console.log(`\n📊 Total flights: ${120 + popularFlightsCount + extraFlightsCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });