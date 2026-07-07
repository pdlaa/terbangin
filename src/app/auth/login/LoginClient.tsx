'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import toast, { Toaster } from 'react-hot-toast';

import { useAuth } from '@/context/auth-context';

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const redirectTo = searchParams.get('redirect') || '/';

    if (user) {
        router.push(redirectTo);
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!recaptchaToken) {
            toast.error('Selesaikan reCAPTCHA');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, recaptchaToken }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal login');
            }

            login(data.user);
            toast.success('Login berhasil!');
            router.push(redirectTo);
        } catch (error: any) {
            toast.error(error?.message || 'Login gagal');
            setRecaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky to-cyan flex items-center justify-center shadow-glow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2">Selamat Datang</h1>
                <p className="text-foreground/60 text-sm">Login untuk melanjutkan perjalanan Anda</p>
            </div>

            {searchParams.get('verified') === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 text-sm text-center">✅ Email berhasil diverifikasi!</p>
                </div>
            )}

            {searchParams.get('error') && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-800 text-sm text-center">{searchParams.get('error')}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                        type="email"
                        placeholder="nama@email.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 transition-all"
                    />
                </div>

                <div className="flex justify-center py-2">
                    <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                        onChange={setRecaptchaToken}
                        onExpired={() => setRecaptchaToken(null)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full glass-button py-3.5 ripple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Memproses...' : 'Login'}
                </button>
            </form>

            <p className="text-center mt-6 text-sm text-foreground/60">
                Belum punya akun?{' '}
                <Link href="/auth/register" className="text-sky font-semibold hover:underline">
                    Daftar
                </Link>
            </p>
            <Toaster />
        </div>
    );
}
