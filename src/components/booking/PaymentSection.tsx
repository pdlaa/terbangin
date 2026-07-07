'use client';

import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options?: {
                    onSuccess?: (result: unknown) => void;
                    onPending?: (result: unknown) => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}

interface PaymentSectionProps {
    bookingId: string;
    bookingCode: string;
    totalPrice: string;
    expiresAt: string;
    clientKey: string;
    snapScriptUrl: string;
    onPaymentConfirmed: () => void;
}

export default function PaymentSection({
    bookingId,
    bookingCode,
    totalPrice,
    expiresAt,
    clientKey,
    snapScriptUrl,
    onPaymentConfirmed,
}: PaymentSectionProps) {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [paying, setPaying] = useState(false);
    const [checking, setChecking] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(totalPrice));

    useEffect(() => {
        const updateTimer = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft('Waktu habis');
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const checkPaymentStatus = useCallback(async (showToast = true) => {
        setChecking(true);
        try {
            const res = await fetch(`/api/payments/status/${bookingId}`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal mengecek status pembayaran');
            }

            if (data.bookingStatus === 'confirmed') {
                if (showToast) toast.success('Pembayaran berhasil dikonfirmasi!');
                onPaymentConfirmed();
                return true;
            }

            if (data.bookingStatus === 'cancelled') {
                if (showToast) toast.error(data.message || 'Booking dibatalkan');
                window.location.reload();
                return false;
            }

            if (showToast) toast(data.message || 'Pembayaran masih menunggu konfirmasi', { icon: '⏳' });
            return false;
        } catch (error: any) {
            if (showToast) toast.error(error.message || 'Gagal mengecek status');
            return false;
        } finally {
            setChecking(false);
        }
    }, [bookingId, onPaymentConfirmed]);

    const pollPaymentStatus = useCallback(async () => {
        for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const confirmed = await checkPaymentStatus(false);
            if (confirmed) return;
        }
        toast('Pembayaran sedang diproses. Klik "Cek Status Pembayaran" jika belum terupdate.', { icon: 'ℹ️' });
    }, [checkPaymentStatus]);

    const handlePay = async () => {
        if (!scriptLoaded || !window.snap) {
            toast.error('Midtrans belum siap. Coba lagi sebentar.');
            return;
        }

        if (new Date(expiresAt) < new Date()) {
            toast.error('Batas waktu pembayaran telah habis');
            return;
        }

        setPaying(true);
        try {
            const res = await fetch('/api/payments/snap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal membuat token pembayaran');
            }

            window.snap.pay(data.snapToken, {
                onSuccess: () => {
                    toast.success('Pembayaran berhasil! Memverifikasi...');
                    pollPaymentStatus();
                },
                onPending: () => {
                    toast('Menunggu konfirmasi pembayaran...', { icon: '⏳' });
                    pollPaymentStatus();
                },
                onError: () => {
                    toast.error('Pembayaran gagal. Silakan coba lagi.');
                },
                onClose: () => {
                    toast('Pembayaran dibatalkan', { icon: 'ℹ️' });
                },
            });
        } catch (error: any) {
            toast.error(error.message || 'Gagal memproses pembayaran');
        } finally {
            setPaying(false);
        }
    };

    return (
        <>
            <Script
                src={snapScriptUrl}
                data-client-key={clientKey}
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />

            <div className="glass-card p-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky to-cyan flex items-center justify-center shadow-glow">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold gradient-text mb-2">Pembayaran Tiket</h2>
                    <p className="text-foreground/60">Selesaikan pembayaran untuk mengaktifkan E-ticket Anda</p>
                </div>

                <div className="bg-gradient-to-r from-sky/10 to-cyan/10 border border-sky/20 rounded-2xl p-6 mb-6 text-center">
                    <div className="text-sm text-foreground/60 mb-2">Kode Booking</div>
                    <div className="text-3xl font-bold text-sky tracking-wider mb-4">{bookingCode}</div>
                    <div className="text-2xl font-bold gradient-text">{formattedPrice}</div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-warm/10 border border-warm/20 mb-6">
                    <span className="text-sm font-semibold">⏱ Batas waktu pembayaran</span>
                    <span className="font-bold text-warm">{timeLeft}</span>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handlePay}
                        disabled={paying || !scriptLoaded || timeLeft === 'Waktu habis'}
                        className="w-full glass-button py-4 text-lg ripple disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {paying ? 'Memproses...' : !scriptLoaded ? 'Memuat Midtrans...' : 'Bayar Sekarang'}
                    </button>

                    <button
                        type="button"
                        onClick={() => checkPaymentStatus(true)}
                        disabled={checking}
                        className="w-full py-3 rounded-xl border border-foreground/20 text-sm font-semibold hover:bg-white/40 transition disabled:opacity-50"
                    >
                        {checking ? 'Mengecek...' : 'Cek Status Pembayaran'}
                    </button>
                </div>

                <p className="text-xs text-center text-foreground/50 mt-4">
                    Pembayaran aman melalui Midtrans Sandbox — Virtual Account, E-Wallet, Kartu Kredit
                </p>
            </div>
        </>
    );
}
