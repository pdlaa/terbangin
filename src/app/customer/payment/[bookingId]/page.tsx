'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import ETicket from '@/components/booking/ETicket';
import PaymentSection from '@/components/booking/PaymentSection';
import OfflineBanner from '@/components/pwa/OfflineBanner';
import { useAuth } from '@/context/auth-context';

function PaymentContent() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params?.bookingId as string;
    const { user, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState<any>(null);
    const [boardingQrPayload, setBoardingQrPayload] = useState('');
    const [isFromCache, setIsFromCache] = useState(false);
    const [loading, setLoading] = useState(true);
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    const [clientKey, setClientKey] = useState('');
    const [snapScriptUrl, setSnapScriptUrl] = useState('');

    useEffect(() => {
        if (isOffline) return;
        if (!authLoading && !user && bookingId) {
            toast.error('Silakan login terlebih dahulu');
            router.push(`/auth/login?redirect=/customer/payment/${bookingId}`);
        }
    }, [authLoading, user, router, bookingId, isOffline]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/booking-detail?id=${bookingId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking tidak ditemukan');
            setBooking(data.booking);
            setBoardingQrPayload(data.boardingQrPayload || '');
            setIsFromCache(false);

            if (data.booking.status === 'confirmed' && data.boardingQrPayload) {
                const { saveETicket } = await import('@/lib/offline/eticket-store');
                await saveETicket({
                    id: bookingId,
                    bookingCode: data.booking.bookingCode,
                    cachedAt: new Date().toISOString(),
                    booking: data.booking,
                    boardingQrPayload: data.boardingQrPayload,
                }).catch(() => {});
            }
        } catch (error: any) {
            const { getETicket } = await import('@/lib/offline/eticket-store');
            const cached = await getETicket(bookingId);
            if (cached) {
                setBooking(cached.booking);
                setBoardingQrPayload(cached.boardingQrPayload);
                setIsFromCache(true);
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (bookingId && user) {
            loadBooking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId, user]);

    useEffect(() => {
        fetch('/api/payments/config')
            .then((r) => r.json())
            .then((data) => {
                if (data.clientKey) setClientKey(data.clientKey);
                if (data.snapScriptUrl) setSnapScriptUrl(data.snapScriptUrl);
            })
            .catch(() => {});
    }, []);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-sky animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <p className="text-foreground/60">Memuat data pembayaran...</p>
                </div>
            </div>
        );
    }

    if (!user || !booking) return null;

    if (['cancelled', 'expired', 'used'].includes(booking.status)) {
        return (
            <div className="min-h-screen sky-gradient">
                <Navbar />
                <div className="pt-24 pb-12 px-6 flex items-center justify-center">
                    <div className="glass-card p-8 max-w-md text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold mb-2">Booking Dibatalkan</h2>
                        <p className="text-foreground/60 mb-6">
                            Booking {booking.bookingCode} telah dibatalkan atau waktu pembayaran habis.
                        </p>
                        <button
                            onClick={() => router.push('/customer/flights')}
                            className="glass-button px-6 py-3 ripple"
                        >
                            Cari Penerbangan Lain
                        </button>
                    </div>
                </div>
                <Toaster />
            </div>
        );
    }

    if (booking.status === 'confirmed') {
        return (
            <div className="min-h-screen sky-gradient">
                <Navbar />
                <div className="pt-24 pb-12 px-6">
                    <OfflineBanner fromCache={isFromCache} />
                    <ETicket
                        booking={booking}
                        bookingId={bookingId}
                        boardingQrPayload={boardingQrPayload}
                        isFromCache={isFromCache}
                        autoCache={false}
                    />
                </div>
                <Toaster />
            </div>
        );
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                {clientKey && snapScriptUrl ? (
                    <PaymentSection
                        bookingId={booking.id}
                        bookingCode={booking.bookingCode}
                        totalPrice={booking.totalPrice}
                        expiresAt={booking.expiresAt}
                        clientKey={clientKey}
                        snapScriptUrl={snapScriptUrl}
                        onPaymentConfirmed={loadBooking}
                    />
                ) : (
                    <div className="glass-card p-8 max-w-md mx-auto text-center">
                        <p className="text-foreground/60 mb-4">
                            Konfigurasi Midtrans belum lengkap. Pastikan{' '}
                            <code className="text-xs">MIDTRANS_SERVER_KEY</code> dan{' '}
                            <code className="text-xs">NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code> sudah diisi di .env
                        </p>
                        <button
                            onClick={() => checkPaymentStatusFallback(booking.id, loadBooking)}
                            className="glass-button px-6 py-3 ripple"
                        >
                            Cek Status Pembayaran
                        </button>
                    </div>
                )}
            </div>
            <Toaster />
        </div>
    );
}

async function checkPaymentStatusFallback(bookingId: string, reload: () => void) {
    try {
        const res = await fetch(`/api/payments/status/${bookingId}`, { method: 'POST' });
        const data = await res.json();
        if (data.bookingStatus === 'confirmed') {
            toast.success('Pembayaran dikonfirmasi!');
            reload();
        } else {
            toast.error(data.message || data.error || 'Status belum dikonfirmasi');
        }
    } catch {
        toast.error('Gagal mengecek status');
    }
}

export default function PaymentPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <p>Loading...</p>
                </div>
            }
        >
            <PaymentContent />
        </Suspense>
    );
}
