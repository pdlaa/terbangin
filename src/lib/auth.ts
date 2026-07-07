import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateToken = (payload: { userId: string; email: string; role: string }): string => {
    const secret = process.env.JWT_SECRET!;
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    };

    return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): { userId: string; email: string; role: string } | null => {
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string };
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
};

export const generateVerificationToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};