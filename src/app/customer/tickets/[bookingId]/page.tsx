'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import ETicket from '@/components/booking/ETicket';
import OfflineBanner from '@/components/pwa/OfflineBanner';
import { useAuth } from '@/context/auth-context';
import { useETicketOffline } from '@/hooks/useETicketOffline';
import { getETicket, getETicketByBookingCode } from '@/lib/offline/eticket-store';

function TicketDetailContent() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params?.bookingId as string;
    const { user, loading: authLoading } = useAuth();
    
    // Gunakan hook bawaan Anda
    const { booking: hookBooking, boardingQrPayload: hookQrPayload, isFromCache: hookIsFromCache, loading: hookLoading, error: hookError } = useETicketOffline(bookingId);

    // Backup State Manual untuk Keamanan Mode Offline
    const [localTicket, setLocalTicket] = useState<any>(null);
    const [localQr, setLocalQr] = useState<string>('');
    const [localLoading, setLocalLoading] = useState(false);

    const isOffline = typeof window !== 'undefined' && !navigator.onLine;

    // 1. Guard Autentikasi: Hanya arahkan ke login jika benar-benar ONLINE
    useEffect(() => {
        if (isOffline) return;
        if (!authLoading && !user) {
            router.push(`/auth/login?redirect=/customer/tickets/${bookingId}`);
        }
    }, [authLoading, user, router, bookingId, isOffline]);

    useEffect(() => {
        if ((isOffline || hookError) && !hookBooking && !hookLoading) {
            setLocalLoading(true);

            const loadLocalTicket = async () => {
                try {
                    const byId = await getETicket(String(bookingId));
                    const byCode = await getETicketByBookingCode(String(bookingId));
                    const result = byId || byCode;
                    if (result) {
                        setLocalTicket(result.booking || result);
                        setLocalQr(result.boardingQrPayload || '');
                    }
                } finally {
                    setLocalLoading(false);
                }
            };

            loadLocalTicket();
        }
    }, [isOffline, hookBooking, hookLoading, hookError, bookingId]);

    // 3. Guard Status Pembayaran: Hanya tendang ke halaman payment jika ONLINE
    useEffect(() => {
        if (isOffline) return;
        if (hookBooking && hookBooking.status !== 'confirmed') {
            router.push(`/customer/payment/${bookingId}`);
        }
    }, [hookBooking, bookingId, router, isOffline]);

    // Konsolidasikan data dari Hook atau dari Database Lokal Offline
    const finalBooking = hookBooking || localTicket;
    const finalQrPayload = hookQrPayload || localQr;
    const finalIsFromCache = hookIsFromCache || !!localTicket;
    const finalLoading = (authLoading || hookLoading || localLoading) && !finalBooking;

    // Tampilan Loading Utama
    if (finalLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60 animate-pulse font-medium">Memuat E-Ticket...</p>
            </div>
        );
    }

    // Tampilan Error / Tiket Benar-benar Kosong di Server maupun Lokal Storage
    if (!finalBooking) {
        return (
            <div className="min-h-screen sky-gradient">
                <Navbar />
                <div className="pt-24 pb-12 px-6 flex items-center justify-center">
                    <div className="glass-card p-8 max-w-md text-center">
                        <div className="text-5xl mb-4">🎫</div>
                        <h2 className="text-xl font-bold mb-2">Tiket Tidak Ditemukan</h2>
                        <p className="text-foreground/60 mb-6">
                            {isOffline 
                                ? 'Tiket ini belum sempat tersimpan di cache lokal perangkat Anda saat online.' 
                                : (hookError || 'E-Ticket tidak tersedia')}
                        </p>
                        <Link href="/customer/tickets" className="glass-button px-6 py-3 inline-block bg-sky text-white rounded-lg font-semibold">
                            Kembali ke Daftar Tiket
                        </Link>
                    </div>
                </div>
                <Toaster />
            </div>
        );
    }

    // Tampilan Sukses Rendering Tiket Penerbangan (Aman diakses Online/Offline)
    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <OfflineBanner fromCache={finalIsFromCache} />
                
                {/* Komponen ETicket Anda akan menerima injeksi data cadangan lokal jika offline */}
                <ETicket
                    booking={finalBooking}
                    bookingId={bookingId}
                    boardingQrPayload={finalQrPayload}
                    isFromCache={finalIsFromCache}
                    autoCache={!finalIsFromCache && !isOffline}
                />
                
                <div className="text-center mt-6">
                    <Link href="/customer/tickets" className="text-sm text-sky hover:underline font-medium">
                        ← Kembali ke semua tiket offline
                    </Link>
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default function TicketDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <TicketDetailContent />
        </Suspense>
    );
}