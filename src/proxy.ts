import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window

function getRateLimitInfo(ip: string) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        const newRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
        rateLimitMap.set(ip, newRecord);
        return { remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: newRecord.resetTime };
    }

    record.count++;
    return { remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count), resetTime: record.resetTime };
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only rate-limit auth routes
    if (pathname.startsWith('/api/auth/')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || '127.0.0.1';

        const { remaining, resetTime } = getRateLimitInfo(ip);

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(resetTime));

        if (remaining <= 0) {
            return new NextResponse(
                JSON.stringify({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
                    },
                }
            );
        }

        return response;
    }

    return NextResponse.next();
}

export const config = {
    // Proxy hanya berjalan di route auth untuk rate limiting
    matcher: ['/api/auth/:path*'],
};