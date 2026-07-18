'use client';

import { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

// Dynamic import reCAPTCHA agar tidak crash jika domain tidak terdaftar
const ReCAPTCHA = lazy(() => import('react-google-recaptcha').then(mod => ({ default: mod.default })));

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [recaptchaReady, setRecaptchaReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!recaptchaToken) {
            toast.error('Selesaikan reCAPTCHA');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, recaptchaToken }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setSuccess(true);
            toast.success('Registrasi berhasil! Cek email Anda.');
        } catch (error: any) {
            toast.error(error.message);
            setRecaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-scale-in">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 gradient-text">Registrasi Berhasil! 🎉</h2>
                <p className="text-foreground/60 mb-6">Silakan cek email Anda untuk verifikasi akun.</p>
                <Link href="/auth/login" className="glass-button px-6 py-3 inline-block">
                    Ke Halaman Login
                </Link>
                <Toaster />
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky to-cyan flex items-center justify-center shadow-glow">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2">Buat Akun</h1>
                <p className="text-foreground/60 text-sm">Bergabung dengan Terbangin sekarang</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 transition-all"
                    />
                </div>

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
                        placeholder="Minimal 8 karakter"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 transition-all"
                    />
                </div>

                <div className="flex justify-center py-2">
                    <Suspense fallback={<div className="w-[304px] h-[78px] bg-white/40 rounded-lg animate-pulse" />}>
                        {typeof window !== 'undefined' && (
                            <ReCAPTCHA
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                                onChange={setRecaptchaToken}
                                onExpired={() => setRecaptchaToken(null)}
                                onLoad={() => setRecaptchaReady(true)}
                            />
                        )}
                    </Suspense>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full glass-button py-3.5 ripple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
            </form>

            <p className="text-center mt-6 text-sm text-foreground/60">
                Sudah punya akun?{' '}
                <Link href="/auth/login" className="text-sky font-semibold hover:underline">
                    Login
                </Link>
            </p>
            <Toaster />
        </div>
    );
}