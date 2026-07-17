import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { verifyRecaptcha } from '@/services/recaptcha/verify';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return NextResponse.json(
                { error: firstIssue?.message || 'Data login tidak valid' },
                { status: 400 }
            );
        }

        const { email, password, recaptchaToken } = parsed.data;

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            return NextResponse.json({ error: 'Verifikasi reCAPTCHA gagal' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
        }

        if (!user.emailVerifiedAt) {
            return NextResponse.json({ error: 'Email belum diverifikasi' }, { status: 403 });
        }

        const token = generateToken({
            userId: user.id.toString(),
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json({
            message: 'Login berhasil',
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}