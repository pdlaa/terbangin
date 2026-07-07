import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // 1. Jika token tidak ada
    if (!token) {
        return NextResponse.redirect(
            new URL('/auth/login?error=Token tidak ditemukan', request.url)
        );
    }

    try {
        // 2. Cari user dengan token yang valid DAN belum expired
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationTokenExpiry: {
                    gte: new Date(), // Token harus belum kadaluarsa
                },
            },
        });

        // 3. Jika user tidak ditemukan atau token invalid/expired
        if (!user) {
            return NextResponse.redirect(
                new URL('/auth/login?error=Token tidak valid atau kadaluarsa', request.url)
            );
        }

        // 4. Update user: set emailVerifiedAt dan hapus token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                emailVerificationToken: null,
                emailVerificationTokenExpiry: null,
            },
        });

        console.log(`✅ Email verified for user: ${user.email}`);

        // 5. Redirect ke login dengan pesan sukses
        return NextResponse.redirect(
            new URL('/auth/login?verified=success', request.url)
        );
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.redirect(
            new URL('/auth/login?error=Terjadi kesalahan pada server', request.url)
        );
    }
}