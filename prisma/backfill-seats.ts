/**
 * Repair script: fills in a standard seat layout for any airplane that
 * currently has zero seats.
 *
 * This fixes flights that show "Denah kursi tidak tersedia untuk
 * penerbangan ini." on the booking page — that message means the flight's
 * airplane has no rows in the `seats` table at all, usually because the
 * database was seeded/imported partially (flights got created, but the
 * seat-generation step for that airplane never ran or was interrupted).
 *
 * Safe to run any time, as many times as you want:
 *  - It only touches airplanes that currently have 0 seats.
 *  - It never deletes or modifies existing seats/bookings.
 *
 * Usage:
 *   npm run db:fix-seats
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function seatLayoutFor(capacity: number) {
    // Same layout convention used in prisma/seed.ts: narrow-body aircraft
    // (capacity < 200) get a 6-abreast economy cabin (A-F), wide-body
    // aircraft get 8-abreast (A-H). The first 5 rows are Business class.
    return capacity < 200
        ? { rows: 20, cols: ['A', 'B', 'C', 'D', 'E', 'F'] }
        : { rows: 30, cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] };
}

async function main() {
    console.log('🔍 Checking airplanes for missing seat layouts...');

    const airplanes = await prisma.airplane.findMany({
        include: { _count: { select: { seats: true } } },
    });

    const missing = airplanes.filter((a) => a._count.seats === 0);

    if (missing.length === 0) {
        console.log('✅ All airplanes already have seats. Nothing to do.');
        return;
    }

    console.log(`⚠️  Found ${missing.length} airplane(s) with no seats. Generating layouts...`);

    for (const airplane of missing) {
        const { rows, cols } = seatLayoutFor(airplane.capacity);
        const seats = [];

        for (let row = 1; row <= rows; row++) {
            for (const col of cols) {
                seats.push({
                    airplaneId: airplane.id,
                    seatNumber: `${row}${col}`,
                    class: row <= 5 ? ('business' as const) : ('economy' as const),
                });
            }
        }

        const result = await prisma.seat.createMany({
            data: seats,
            skipDuplicates: true,
        });

        console.log(
            `  ✅ Airplane #${airplane.id} (${airplane.model}, ${airplane.registrationNumber}): created ${result.count} seats`
        );
    }

    console.log('🎉 Done. Affected flights should now show a selectable seat map.');
}

main()
    .catch((e) => {
        console.error('❌ Backfill failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
