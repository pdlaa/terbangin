'use client';

import { useCallback, useEffect, useState } from 'react';
import { saveETicket, getETicket, getETicketByBookingCode } from '@/lib/offline/eticket-store';
import type { CachedETicket, ETicketBooking } from '@/lib/offline/types';

interface UseETicketOfflineResult {
    booking: ETicketBooking | null;
    boardingQrPayload: string;
    isFromCache: boolean;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useETicketOffline(bookingId: string, options?: { skipAuthFetch?: boolean }): UseETicketOfflineResult {
    const [booking, setBooking] = useState<ETicketBooking | null>(null);
    const [boardingQrPayload, setBoardingQrPayload] = useState('');
    const [isFromCache, setIsFromCache] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cacheTicket = useCallback(
        async (data: { booking: ETicketBooking; boardingQrPayload: string }) => {
            if (data.booking.status !== 'confirmed') return;

            const ticket: CachedETicket = {
                id: bookingId,
                bookingCode: data.booking.bookingCode,
                cachedAt: new Date().toISOString(),
                booking: data.booking,
                boardingQrPayload: data.boardingQrPayload,
            };

            try {
                await saveETicket(ticket);
            } catch (err) {
                console.warn('Failed to cache E-Ticket:', err);
            }
        },
        [bookingId],
    );

    const loadFromCacheByIdOrCode = useCallback(async (): Promise<boolean> => {
        const cachedById = await getETicket(bookingId);
        if (cachedById) {
            setBooking(cachedById.booking);
            setBoardingQrPayload(cachedById.boardingQrPayload);
            setIsFromCache(true);
            setError(null);
            return true;
        }

        const cachedByCode = await getETicketByBookingCode(bookingId);
        if (cachedByCode) {
            setBooking(cachedByCode.booking);
            setBoardingQrPayload(cachedByCode.boardingQrPayload);
            setIsFromCache(true);
            setError(null);
            return true;
        }

        return false;
    }, [bookingId]);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);

        const isOffline = typeof window !== 'undefined' && !navigator.onLine;
        if (isOffline) {
            const found = await loadFromCacheByIdOrCode();
            if (!found) {
                setError('E-Ticket belum tersimpan di cache perangkat. Buka tiket ini saat online terlebih dahulu.');
                setBooking(null);
            }
            setLoading(false);
            return;
        }

        try {
            if (!options?.skipAuthFetch) {
                const res = await fetch(`/api/booking-detail?id=${bookingId}`);

                if (res.ok) {
                    const data = await res.json();
                    setBooking(data.booking);
                    setBoardingQrPayload(data.boardingQrPayload || '');
                    setIsFromCache(false);

                    await cacheTicket({
                        booking: data.booking,
                        boardingQrPayload: data.boardingQrPayload || '',
                    });
                    return;
                }
            }

            throw new Error('Network unavailable');
        } catch {
            const found = await loadFromCacheByIdOrCode();
            if (!found) {
                setError('E-Ticket tidak tersedia. Buka tiket ini sekali saat online terlebih dahulu.');
                setBooking(null);
            }
        } finally {
            setLoading(false);
        }
    }, [bookingId, cacheTicket, loadFromCacheByIdOrCode, options?.skipAuthFetch]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { booking, boardingQrPayload, isFromCache, loading, error, reload };
}

export async function loadAllCachedTickets(): Promise<CachedETicket[]> {
    const { getAllETickets } = await import('@/lib/offline/eticket-store');
    return getAllETickets();
}

