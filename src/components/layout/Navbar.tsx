'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function Navbar() {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLandingPage = pathname === '/';
    const isBackOfficeUser = user && ['admin', 'staff', 'manager'].includes(user.role);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="glass-card px-6 py-3 flex items-center justify-between shadow-glass">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky to-cyan flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold gradient-text">Terbangin</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* Only show landing page links if on the landing page */}
                        {isLandingPage && (
                            <>
                                <a href="#destinations" className="text-sm font-medium text-foreground/70 hover:text-sky transition-colors">Destinasi</a>
                                <a href="#airlines" className="text-sm font-medium text-foreground/70 hover:text-sky transition-colors">Maskapai</a>
                                <a href="#promo" className="text-sm font-medium text-foreground/70 hover:text-sky transition-colors">Promo</a>
                                <a href="#testimonials" className="text-sm font-medium text-foreground/70 hover:text-sky transition-colors">Testimoni</a>
                            </>
                        )}
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {!mounted || loading ? (
                            <div className="w-24 h-9 rounded-xl bg-white/40 animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Show dashboard quick link on navbar for back-office users */}
                                {isBackOfficeUser && (
                                    <Link
                                        href={user.role === 'manager' ? '/manager/dashboard' : '/admin/dashboard'}
                                        className="hidden sm:block text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors mr-2"
                                    >
                                        Dashboard
                                    </Link>
                                )}

                                {/* Show Tiket Saya for customer role */}
                                {user.role === 'customer' && (
                                    <Link
                                        href="/customer/tickets"
                                        className="hidden sm:block text-sm font-semibold text-sky hover:text-sky-dark transition-colors mr-2"
                                    >
                                        Tiket Saya
                                    </Link>
                                )}

                                <span className="hidden sm:block text-sm font-semibold text-foreground/80">
                                    Hai, {user.name.split(' ')[0]}
                                </span>
                                <button
                                    onClick={() => logout()}
                                    className="glass-button px-5 py-2.5 text-sm ripple"
                                >
                                    Keluar
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-sky hover:text-sky-dark transition-colors">
                                    Masuk
                                </Link>
                                <Link href="/auth/register" className="glass-button px-5 py-2.5 text-sm ripple">
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}