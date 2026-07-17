import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/services/mail/mailer';
import { verifyRecaptcha } from '@/services/recaptcha/verify';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return NextResponse.json(
                { error: firstIssue?.message || 'Data registrasi tidak valid' },
                { status: 400 }
            );
        }

        const { name, email, password, recaptchaToken } = parsed.data;

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            return NextResponse.json({ error: 'Verifikasi reCAPTCHA gagal' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);
        const verificationToken = generateVerificationToken();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'customer',
                emailVerificationToken: verificationToken,
                emailVerificationTokenExpiry: tokenExpiry,
            },
        });

        await sendVerificationEmail(email, verificationToken, name);

        return NextResponse.json({ message: 'Registrasi berhasil. Silakan cek email Anda.' }, { status: 201 });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}