'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { getAllETickets, saveETicket } from '@/lib/offline/eticket-store';
import type { CachedETicket } from '@/lib/offline/types';

interface TicketData {
    id: string | number;
    bookingCode: string;
    booking?: {
        bookingCode?: string;
        status?: string;
        price?: number;
        flight?: {
            flightNumber?: string;
            departureAirport?: { iataCode: string; name: string };
            arrivalAirport?: { iataCode: string; name: string };
            departureTime?: string;
        };
    };
    [key: string]: any; // Flexibilitas struktur data
}

export default function CustomerTicketsPage() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        const checkOnlineStatus = typeof window !== 'undefined' && navigator.onLine;

        async function loadFromCache() {
            try {
                const cachedTickets = await getAllETickets();
                setTickets(cachedTickets as TicketData[]);
            } catch (err) {
                console.warn('Gagal memuat tiket dari cache lokal', err);
                setError('Gagal memuat tiket dari cache lokal.');
            } finally {
                setLoading(false);
            }
        }

        async function fetchTickets() {
            if (!checkOnlineStatus) {
                setIsOfflineMode(true);
                await loadFromCache();
                return;
            }

            try {
                const res = await fetch('/api/bookings');
                if (!res.ok) throw new Error('Gagal mengambil data dari server');

                const data = await res.json();
                const freshTickets = data.bookings || data;
                setTickets(freshTickets);

                await Promise.all(
                    (freshTickets as any[]).map((ticket) =>
                        saveETicket({
                            id: ticket.id?.toString() || `${ticket.bookingCode}`,
                            bookingCode: ticket.bookingCode,
                            cachedAt: new Date().toISOString(),
                            booking: ticket,
                            boardingQrPayload: ticket.boardingQrPayload || '',
                        })
                    )
                );

                setLoading(false);
            } catch (err) {
                console.warn('Gagal fetch server, mencoba ambil dari cache lokal...', err);
                setIsOfflineMode(true);
                await loadFromCache();
            }
        }

        fetchTickets();
    }, []);

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            
            <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-2">
                    Tiket {isOfflineMode && <span className="text-sky">Offline</span>} Saya
                </h1>
                <p className="text-foreground/60 mb-8">
                    E-Ticket tersimpan di perangkat Anda – akses tanpa internet di bandara
                </p>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <p className="text-foreground/60 animate-pulse font-medium">Memuat tiket...</p>
                    </div>
                ) : error ? (
                    <div className="glass-card p-6 text-red-500 max-w-md mx-auto">{error}</div>
                ) : tickets.length === 0 ? (
                    <div className="glass-card p-8 max-w-md mx-auto">
                        <p className="text-foreground/60">Tidak ada tiket offline yang tersimpan di perangkat ini.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 text-left max-w-2xl mx-auto">
                        {tickets.map((ticket) => {
                            // Ambil data maskapai/harga baik dari objek flat atau objek terbungkus (booking)
                            const bookingCode = ticket.bookingCode || ticket.booking?.bookingCode || 'N/A';
                            const price = ticket.booking?.price || ticket.price || 0;
                            const flight = ticket.booking?.flight || ticket.flight;

                            return (
                                <div key={ticket.id?.toString()} className="glass-card p-5 flex justify-between items-center relative overflow-hidden">
                                    <div>
                                        <span className="text-xs font-mono bg-sky/10 text-sky px-2 py-0.5 rounded-md">
                                            ID: {ticket.id}
                                        </span>
                                        <p className="text-sm text-foreground/40 mt-1">Kode Booking</p>
                                        <p className="text-xl font-black text-sky">{bookingCode}</p>
                                        {flight && (
                                            <p className="text-xs text-foreground/60 mt-1">
                                                {flight.departureAirport?.iataCode || '---'} → {flight.arrivalAirport?.iataCode || '---'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">
                                            Rp {Number(price).toLocaleString('id-ID')}
                                        </p>
                                        <Link 
                                            href={`/customer/tickets/${ticket.id}`}
                                            className="glass-button text-xs px-4 py-2 inline-block mt-3 bg-sky text-white font-semibold rounded-lg"
                                        >
                                            Buka Detail
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}