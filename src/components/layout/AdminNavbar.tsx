'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const adminMenu = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Penerbangan', href: '/admin/flights', icon: '✈️' },
    { label: 'Bandara', href: '/admin/airports', icon: '🏢' },
    { label: 'Maskapai', href: '/admin/airlines', icon: '🦅' },
    { label: 'Armada', href: '/admin/airplanes', icon: '🛫' },
    { label: 'Kursi', href: '/admin/seats', icon: '💺' },
    { label: 'Penumpang', href: '/admin/passengers', icon: '👥' },
    { label: 'Scanner', href: '/admin/scanner', icon: '📷' },
];

const staffMenu = [
    { label: 'Dashboard', href: '/staff/dashboard', icon: '📊' },
    { label: 'Penerbangan', href: '/admin/flights', icon: '✈️' },
    { label: 'Penumpang', href: '/admin/passengers', icon: '👥' },
    { label: 'Scanner', href: '/admin/scanner', icon: '📷' },
];

export default function AdminNavbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-card px-6 py-3 flex items-center justify-between shadow-glass">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg" />
                            <span className="text-xl font-bold text-indigo-600">Terbangin</span>
                        </div>
                        <div className="w-24 h-9 rounded-xl bg-white/40 animate-pulse" />
                    </div>
                </div>
            </nav>
        );
    }

    const menu = user?.role === 'staff' ? staffMenu : adminMenu;

    const isActive = (href: string) => {
        if (href === '/admin/dashboard' || href === '/staff/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 backdrop-blur-xl border border-indigo-100/60 rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between shadow-lg shadow-indigo-500/5">
                    {/* Logo */}
                    <Link href={user?.role === 'staff' ? '/staff/dashboard' : '/admin/dashboard'} className="flex items-center gap-2 group shrink-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                        </div>
                        <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Terbangin</span>
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 ml-1">
                            {user?.role === 'staff' ? 'Staff' : 'Admin'}
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
                        {menu.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                    isActive(item.href)
                                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                        : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="hidden md:block text-sm font-semibold text-gray-600 truncate max-w-[120px]">
                            {user?.name?.split(' ')[0]}
                        </span>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        <button
                            onClick={() => logout()}
                            className="glass-button px-4 md:px-5 py-2 text-xs md:text-sm ripple"
                        >
                            Keluar
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-xl border border-indigo-100/60 rounded-2xl shadow-xl overflow-hidden animate-fade-in-down">
                        <div className="p-3 grid grid-cols-2 gap-1">
                            {menu.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                        isActive(item.href)
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}