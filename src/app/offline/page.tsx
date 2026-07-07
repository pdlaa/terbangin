'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ETicket from '@/components/booking/ETicket';
import { getETicket, getETicketByBookingCode } from '@/lib/offline/eticket-store';
import type { CachedETicket } from '@/lib/offline/types';

export default function OfflinePage() {
    const [cachedTicket, setCachedTicket] = useState<CachedETicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [ticketId, setTicketId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const path = window.location.pathname;
        const match = path.match(/^\/customer\/tickets\/(.+)$/);
        if (match) {
            setTicketId(match[1]);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!ticketId) return;

        const loadCachedTicket = async () => {
            setLoading(true);
            try {
                const byId = await getETicket(String(ticketId));
                const byCode = !byId ? await getETicketByBookingCode(String(ticketId)) : null;
                const ticket = byId || byCode;
                setCachedTicket(ticket);
            } catch (err) {
                console.warn('Gagal memuat tiket offline:', err);
            } finally {
                setLoading(false);
            }
        };

        loadCachedTicket();
    }, [ticketId]);

    const isTicketPath = Boolean(ticketId);

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6 flex items-center justify-center min-h-[70vh]">
                <div className="glass-card p-8 max-w-3xl mx-auto text-center">
                    {isTicketPath ? (
                        loading ? (
                            <div className="py-12">
                                <p className="text-foreground/60 animate-pulse font-medium">Memuat tiket offline...</p>
                            </div>
                        ) : cachedTicket ? (
                            <div>
                                <p className="mb-6 text-sm uppercase tracking-[0.24em] text-slate-500">Offline mode</p>
                                <ETicket
                                    booking={cachedTicket.booking}
                                    bookingId={cachedTicket.id}
                                    boardingQrPayload={cachedTicket.boardingQrPayload}
                                    isFromCache={true}
                                    autoCache={false}
                                />
                            </div>
                        ) : (
                            <div className="py-12">
                                <div className="text-6xl mb-4">📴</div>
                                <h1 className="text-2xl font-bold mb-2">Tiket Tidak Ditemukan</h1>
                                <p className="text-foreground/60 mb-6">
                                    Tiket ini belum tersimpan di cache lokal. Buka tiket sekali saat online terlebih dahulu.
                                </p>
                                <Link href="/customer/tickets" className="glass-button px-6 py-3 ripple inline-block">
                                    Lihat Semua Tiket Offline
                                </Link>
                            </div>
                        )
                    ) : (
                        <div>
                            <div className="text-6xl mb-4">📴</div>
                            <h1 className="text-2xl font-bold mb-2">Anda Sedang Offline</h1>
                            <p className="text-foreground/60 mb-6">
                                Koneksi internet terputus. E-Ticket yang pernah dibuka tetap dapat diakses dari cache lokal.
                            </p>
                            <Link href="/customer/tickets" className="glass-button px-6 py-3 ripple inline-block">
                                Buka Tiket Offline Saya
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
