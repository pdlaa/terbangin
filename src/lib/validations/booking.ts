import { z } from 'zod';

export const passengerInputSchema = z.object({
    seatId: z.string().regex(/^\d+$/, 'Kursi wajib dipilih'),
    fullName: z
        .string()
        .trim()
        .min(3, 'Nama lengkap minimal 3 karakter')
        .max(100, 'Nama lengkap maksimal 100 karakter'),
    gender: z.enum(['male', 'female'], {
        errorMap: () => ({ message: 'Jenis kelamin wajib dipilih' }),
    }),
    birthDate: z
        .string()
        .refine((v) => !isNaN(Date.parse(v)), 'Tanggal lahir tidak valid')
        .refine((v) => new Date(v) < new Date(), 'Tanggal lahir tidak valid'),
    passportNumber: z
        .string()
        .trim()
        .min(5, 'Nomor identitas/paspor minimal 5 karakter')
        .max(30, 'Nomor identitas/paspor maksimal 30 karakter')
        .regex(/^[A-Za-z0-9]+$/, 'Nomor identitas/paspor hanya boleh huruf dan angka'),
});

export const createBookingSchema = z
    .object({
        flightId: z.string().regex(/^\d+$/, 'Flight ID tidak valid'),
        contactEmail: z.string().trim().email('Email kontak tidak valid'),
        contactPhone: z
            .string()
            .trim()
            .min(8, 'Nomor telepon minimal 8 digit')
            .max(20, 'Nomor telepon maksimal 20 digit')
            .regex(/^[0-9+\-\s]+$/, 'Nomor telepon tidak valid'),
        passengers: z
            .array(passengerInputSchema)
            .min(1, 'Minimal 1 penumpang')
            .max(6, 'Maksimal 6 penumpang dalam satu kali booking'),
    })
    .refine(
        (data) => {
            const seatIds = data.passengers.map((p) => p.seatId);
            return new Set(seatIds).size === seatIds.length;
        },
        {
            message: 'Setiap penumpang harus memilih kursi yang berbeda',
            path: ['passengers'],
        }
    )
    .refine(
        (data) => {
            const passportNumbers = data.passengers.map((p) => p.passportNumber.toUpperCase());
            return new Set(passportNumbers).size === passportNumbers.length;
        },
        {
            message: 'Nomor identitas/paspor tidak boleh sama antar penumpang',
            path: ['passengers'],
        }
    );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
    status: z.literal('cancelled'),
});
