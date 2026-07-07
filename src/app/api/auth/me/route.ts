import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: BigInt(payload.userId) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerifiedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                ...user,
                id: user.id.toString(),
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}