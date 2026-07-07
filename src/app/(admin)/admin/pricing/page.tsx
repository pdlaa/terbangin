'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

function PricingContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60">Loading...</p>
            </div>
        );
    }

    if (!user || !['admin'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/dashboard" className="text-sky-400 hover:text-sky-300 mb-6 inline-block">
                        ← Kembali ke Dashboard
                    </Link>

                    <h1 className="text-4xl font-bold mb-8">
                        Manajemen <span className="gradient-text">Harga</span>
                    </h1>

                    <div className="glass-card p-8 rounded-2xl text-center">
                        <p className="text-lg text-foreground/60 mb-4">🔨 Fitur sedang dalam tahap pengembangan</p>
                        <p className="text-foreground/40">
                            Halaman manajemen harga dinamis dan promo akan segera tersedia
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PricingContent />
        </Suspense>
    );
}
