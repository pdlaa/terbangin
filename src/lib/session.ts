import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

export interface SessionUser {
    userId: string;
    email: string;
    role: string;
}

/**
 * Reads and verifies the JWT stored in the httpOnly `token` cookie.
 * This is the ONLY source of truth for "who is the current user" on the
 * server. API routes must never trust a userId sent in the request body.
 */
export function getSessionUser(request: NextRequest): SessionUser | null {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export function requireRole(session: SessionUser | null, roles: string[]): boolean {
    if (!session) return false;
    return roles.includes(session.role);
}
