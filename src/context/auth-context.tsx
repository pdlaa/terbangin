'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    /** Set the user immediately (e.g. right after a successful login POST),
     *  so pages navigated to right after don't think we're logged out. */
    login: (user: User) => void;
    /** Re-fetch /api/auth/me and update the context. Useful after actions
     *  that change auth state without returning the user object directly. */
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) throw new Error('unauthenticated');
            const data = await res.json();
            setUser(data.user);
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        fetchUser().finally(() => setLoading(false));
    }, []);

    const login = (nextUser: User) => {
        setUser(nextUser);
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, login, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};