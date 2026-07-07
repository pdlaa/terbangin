'use client';

import { useEffect } from 'react';
import QRCode from 'react-qr-code';
import type { ETicketBooking } from '@/lib/offline/types';
import { saveETicket } from '@/lib/offline/eticket-store';

interface ETicketProps {
    booking: ETicketBooking;
    bookingId?: string;
    boardingQrPayload?: string;
    isFromCache?: boolean;
    autoCache?: boolean;
}

const classLabel: Record<string, string> = {
    economy: 'Economy',
    business: 'Business',
    first: 'First Class',
};

export default function ETicket({
    booking,
    bookingId,
    boardingQrPayload = '',
    isFromCache = false,
    autoCache = true,
}: ETicketProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const passengers =
        booking.passengers && booking.passengers.length > 0
            ? booking.passengers
            : [{ fullName: booking.passengerName, seat: booking.seat || null }];

    const now = new Date();
    const departureDate = new Date(booking.flight.departureTime);
    const isExpired = booking.status === 'expired' || (booking.status === 'confirmed' && departureDate.getTime() <= now.getTime());
    const isUsed = booking.status === 'used';
    const isPending = booking.status === 'pending';
    const isConfirmed = booking.status === 'confirmed' && !isExpired;
    const isCancelled = booking.status === 'cancelled';
    const cacheId = bookingId || booking.id;

    useEffect(() => {
        if (!autoCache || !cacheId || !isConfirmed || !boardingQrPayload) return;

        saveETicket({
            id: cacheId,
            bookingCode: booking.bookingCode,
            cachedAt: new Date().toISOString(),
            booking,
            boardingQrPayload,
        }).catch((err) => console.warn('E-Ticket cache failed:', err));
    }, [autoCache, cacheId, isConfirmed, boardingQrPayload, booking]);

    return (
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/20 bg-white/80 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="mb-6 rounded-[28px] bg-gradient-to-br from-sky-600 via-cyan-500 to-slate-900 p-6 text-white shadow-lg sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                            <span>✈</span>
                            <span>Boarding Pass</span>
                        </div>
                        <h2 className="text-2xl font-semibold sm:text-3xl">
                            {isPending ? 'Booking Dibuat' : 'E-Ticket Siap Dipakai'}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                            {isPending
                                ? 'Selesaikan pembayaran untuk mengaktifkan tiket Anda.'
                                : isFromCache
                                  ? 'Tiket ini ditampilkan dari cache lokal dan siap dipakai saat offline.'
                                  : 'Tiket Anda disimpan di perangkat untuk akses offline yang aman.'}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Kode Booking</p>
                        <p className="mt-1 text-xl font-semibold tracking-[0.25em]">{booking.bookingCode}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
                {isPending && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        Menunggu Pembayaran
                    </span>
                )}
                {isConfirmed && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {isFromCache ? 'Tersedia Offline' : 'Aktif'}
                    </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {booking.flight.flightNumber}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {booking.flight.airline.name}
                </span>
            </div>

            {isConfirmed && boardingQrPayload && !isExpired && !isUsed && (
                <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
                    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-center lg:text-left">
                            <p className="text-sm font-semibold text-slate-700">QR Boarding Pass</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Tunjukkan QR ini saat check-in atau boarding.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <QRCode value={boardingQrPayload} size={170} level="M" bgColor="#FFFFFF" fgColor="#0F172A" />
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 font-semibold text-white">
                            {booking.flight.airline.code}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-800">{booking.flight.airline.name}</p>
                            <p className="text-sm text-slate-500">{booking.flight.flightNumber}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                        <p className="text-slate-500">Penumpang</p>
                        <p className="font-semibold text-slate-800">{passengers.length} orang</p>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <p className="text-3xl font-semibold text-slate-800">{formatTime(booking.flight.departureTime)}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-700">{booking.flight.departureAirport.iataCode}</p>
                        <p className="text-sm text-slate-500">{booking.flight.departureAirport.city}</p>
                    </div>

                    <div className="flex justify-center">
                        <div className="rounded-full border border-sky-200 bg-sky-50 p-3 text-sky-600">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <p className="text-3xl font-semibold text-slate-800">{formatTime(booking.flight.arrivalTime)}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-700">{booking.flight.arrivalAirport.iataCode}</p>
                        <p className="text-sm text-slate-500">{booking.flight.arrivalAirport.city}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl bg-white p-4 text-center shadow-sm">
                    <p className="text-sm text-slate-500">Tanggal Keberangkatan</p>
                    <p className="mt-1 font-semibold text-slate-800">{formatDate(booking.flight.departureTime)}</p>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Manifest Penumpang</p>
                    {booking.totalPrice && (
                        <p className="text-sm text-slate-500">Total: {booking.totalPrice}</p>
                    )}
                </div>

                <div className="space-y-3">
                    {passengers.map((p, i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-semibold text-slate-800">{p.fullName}</span>
                            <div className="flex items-center gap-3">
                                {p.seat?.class && (
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                        {classLabel[p.seat.class] || p.seat.class}
                                    </span>
                                )}
                                <span className="font-semibold text-sky-600">{p.seat?.seatNumber || '-'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                    <span>📱</span>
                    <span>Langkah Selanjutnya</span>
                </h4>
                <ul className="space-y-1 text-sm text-slate-600">
                    {isPending ? (
                        <>
                            <li>• Selesaikan pembayaran sebelum batas waktu habis.</li>
                            <li>• E-ticket akan aktif otomatis setelah pembayaran terverifikasi.</li>
                        </>
                    ) : (
                        <>
                            <li>• Tiket tersimpan di perangkat dan tetap dapat dibuka saat offline.</li>
                            <li>• Tunjukkan QR boarding pass atau kode booking saat check-in.</li>
                            <li>• Datang ke bandara minimal 2 jam sebelum keberangkatan.</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
