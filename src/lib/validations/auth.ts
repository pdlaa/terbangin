import { z } from 'zod';

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter'),
    email: z
        .string()
        .trim()
        .email('Format email tidak valid')
        .max(255, 'Email maksimal 255 karakter'),
    password: z
        .string()
        .min(8, 'Password minimal 8 karakter')
        .max(72, 'Password maksimal 72 karakter'),
    recaptchaToken: z
        .string()
        .min(1, 'Verifikasi reCAPTCHA wajib diisi'),
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email('Format email tidak valid'),
    password: z
        .string()
        .min(1, 'Password wajib diisi'),
    recaptchaToken: z
        .string()
        .min(1, 'Verifikasi reCAPTCHA wajib diisi'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;