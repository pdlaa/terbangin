import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding mock bookings and payments...');

    // 1. Get user
    const user = await prisma.user.findFirst({
        where: { role: 'admin' },
    });

    if (!user) {
        console.error('❌ Admin user not found. Please run db:seed first.');
        return;
    }

    // 2. Get flights
    const flights = await prisma.flight.findMany({
        take: 40,
        include: {
            airplane: {
                include: {
                    seats: true
                }
            }
        }
    });

    if (flights.length === 0) {
        console.error('❌ No flights found. Please run db:seed first.');
        return;
    }

    const names = [
        'Ahmad Hidayat', 'Siti Rahma', 'Budi Santoso', 'Dewi Lestari', 
        'Eko Prasetyo', 'Mega Utami', 'Rian Wijaya', 'Indah Permata',
        'Fajar Nugroho', 'Lia Natalia', 'Hadi Kusuma', 'Rina Melati',
        'Adit Pratama', 'Yuni Safitri', 'Taufik Hidayat', 'Diana Putri',
        'Hendra Wijaya', 'Sari Indah', 'Denny Siregar', 'Ani Suryani'
    ];

    let bookingCount = 0;
    let paymentCount = 0;

    // Create bookings over the last 30 days
    const now = new Date();
    
    for (let i = 0; i < flights.length; i++) {
        const flight = flights[i];
        const numBookings = Math.floor(Math.random() * 3) + 2; // 2 to 4 bookings per flight
        const seats = flight.airplane.seats;

        if (seats.length === 0) continue;

        for (let b = 0; b < numBookings; b++) {
            const passengerName = names[(i * 3 + b) % names.length];
            const bookingCode = `TB${flight.flightNumber}${1000 + i * 5 + b}`;
            
            // Randomize status based on time
            let status = 'confirmed';
            if (i % 5 === 0) status = 'used';
            else if (i % 5 === 1) status = 'expired';
            else if (i % 5 === 2) status = 'pending';
            else if (i % 5 === 3) status = 'cancelled';

            const createdDate = new Date();
            createdDate.setDate(now.getDate() - (i % 30));
            createdDate.setHours(8 + (b * 2), 0, 0, 0);

            // Get a random seat
            const seatIndex = (i * 3 + b) % seats.length;
            const seat = seats[seatIndex];

            // Create booking
            const booking = await prisma.booking.create({
                data: {
                    userId: user.id,
                    flightId: flight.id,
                    bookingCode,
                    passengerName,
                    passengerEmail: `${passengerName.toLowerCase().replace(' ', '')}@example.com`,
                    passengerPhone: '08123456789',
                    totalPrice: flight.price,
                    status: status as any,
                    expiresAt: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000),
                    createdAt: createdDate,
                    updatedAt: createdDate,
                }
            });

            // Create Passenger record
            await prisma.passenger.create({
                data: {
                    bookingId: booking.id,
                    flightId: flight.id,
                    fullName: passengerName,
                    gender: b % 2 === 0 ? 'male' : 'female',
                    birthDate: new Date('1990-01-01'),
                    passportNumber: `A${123456 + b}`,
                    seatId: seat.id,
                    seatNumber: seat.seatNumber,
                    createdAt: createdDate,
                    updatedAt: createdDate,
                }
            });

            bookingCount++;

            // Create Payment for confirmed, used, or expired
            if (['confirmed', 'used', 'expired'].includes(status)) {
                await prisma.payment.create({
                    data: {
                        bookingId: booking.id,
                        paymentMethod: ['GoPay', 'OVO', 'Transfer Bank', 'Kartu Kredit'][b % 4],
                        amount: flight.price,
                        paymentStatus: 'paid',
                        transactionCode: `TX-${bookingCode}`,
                        paidAt: createdDate,
                        userId: user.id,
                        createdAt: createdDate,
                        updatedAt: createdDate,
                    }
                });
                paymentCount++;
            }
        }
    }

    console.log(`🎉 Seeded ${bookingCount} bookings and ${paymentCount} payments successfully!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
