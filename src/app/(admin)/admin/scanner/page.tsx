'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';

function ScannerContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [lastScannedCode, setLastScannedCode] = useState('');
    const [manualBookingCode, setManualBookingCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        bookingCode?: string;
        passengerName?: string;
        flightNumber?: string;
        departureTime?: string;
        manifest?: any;
        used?: boolean;
        message?: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    // Check auth
    useEffect(() => {
        if (!authLoading && !user) {
            toast.error('Silakan login terlebih dahulu');
            router.push('/auth/login?redirect=/admin/scanner');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!isScanning || !videoRef.current) return;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                toast.error('Tidak dapat mengakses kamera perangkat');
                setIsScanning(false);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, [isScanning]);

    // Simple QR decoder - untuk production bisa pakai library seperti `jsqr` atau `zxing`
    const decodeQR = async (canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        const context = canvas.getContext('2d');
        if (!context) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            // Untuk demo, kami menggunakan canvas 2d. Untuk production gunakan library QR decoder
            // Placeholder untuk scanning logic
            return null;
        } catch (error) {
            console.error('QR decode error:', error);
            return null;
        }
    };

    const handleManualValidation = async (bookingCode: string) => {
        if (!bookingCode.trim()) {
            toast.error('Masukkan kode booking terlebih dahulu');
            return;
        }

        setLoading(true);
        setValidationResult(null);

        try {
            const response = await fetch('/api/boarding/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingCode: bookingCode.trim().toUpperCase() }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setValidationResult({
                    valid: true,
                    bookingCode: data.manifest?.code,
                    passengerName: data.manifest?.pax?.[0]?.n,
                    flightNumber: data.manifest?.fn,
                    departureTime: data.manifest?.depAt,
                    manifest: data.manifest,
                    used: data.used,
                });

                if (data.used) {
                    toast.success('✅ Penumpang berhasil diperiksa dan masuk ke pesawat!');
                } else {
                    toast.success('✅ Tiket valid! Penumpang dapat boarding.');
                }

                setManualBookingCode('');
                setLastScannedCode(bookingCode);

                // Auto-clear after 5 seconds
                setTimeout(() => setValidationResult(null), 5000);
            } else {
                setValidationResult({
                    valid: false,
                    message: data.error || 'Validasi gagal',
                });
                toast.error('❌ ' + (data.error || 'Tiket tidak valid'));
            }
        } catch (error: any) {
            setValidationResult({
                valid: false,
                message: error.message || 'Terjadi kesalahan server',
            });
            toast.error('❌ Terjadi kesalahan saat validasi');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center">
                <p className="text-foreground/60">Loading...</p>
            </div>
        );
    }

    if (!user || !['admin', 'staff', 'manager'].includes(user.role)) {
        return null;
    }

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2 text-center">
                        <span className="gradient-text">QR Scanner</span>
                    </h1>
                    <p className="text-center text-foreground/60 mb-8">
                        Pindai boarding pass penumpang atau masukkan kode booking secara manual
                    </p>

                    {/* Scanner Mode Toggle */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setIsScanning(!isScanning)}
                            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                                isScanning
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'glass-card text-foreground hover:bg-white/40'
                            }`}
                        >
                            {isScanning ? '📷 Kamera Aktif' : '📷 Aktifkan Kamera'}
                        </button>
                        <button
                            onClick={() => setIsScanning(false)}
                            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                                !isScanning
                                    ? 'bg-sky-500 text-white shadow-lg'
                                    : 'glass-card text-foreground hover:bg-white/40'
                            }`}
                        >
                            ⌨️ Input Manual
                        </button>
                    </div>

                    {/* Camera Preview */}
                    {isScanning && (
                        <div className="glass-card p-6 mb-8 rounded-3xl">
                            <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '9/12' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* QR Scanning Guide */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 border-4 border-cyan-400 rounded-2xl opacity-50" />
                                </div>
                            </div>
                            <p className="text-center text-sm text-foreground/60">
                                Arahkan kamera ke QR code boarding pass
                            </p>
                        </div>
                    )}

                    {/* Manual Input */}
                    {!isScanning && (
                        <div className="glass-card p-8 mb-8 rounded-3xl">
                            <label className="block text-sm font-semibold text-foreground/80 mb-3">
                                Kode Booking
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={manualBookingCode}
                                    onChange={(e) => setManualBookingCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualValidation(manualBookingCode)}
                                    placeholder="Contoh: TB1234567XYZ"
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/40 border border-white/60 focus:outline-none focus:ring-2 focus:ring-sky/40 text-foreground placeholder:text-foreground/40"
                                />
                                <button
                                    onClick={() => handleManualValidation(manualBookingCode)}
                                    disabled={loading || !manualBookingCode.trim()}
                                    className="px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 disabled:opacity-50 transition-all"
                                >
                                    {loading ? '⏳' : '✓'} Validasi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Validation Result */}
                    {validationResult && (
                        <div
                            className={`glass-card p-8 rounded-3xl mb-8 ${
                                validationResult.valid ? 'border-2 border-emerald-500 bg-emerald-500/10' : 'border-2 border-red-500 bg-red-500/10'
                            }`}
                        >
                            <div className="text-center">
                                <div className="text-6xl mb-4">
                                    {validationResult.valid ? '✅' : '❌'}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">
                                    {validationResult.valid ? 'Tiket Valid' : 'Tiket Tidak Valid'}
                                </h3>

                                {validationResult.valid && (
                                    <div className="space-y-3 text-left bg-white/30 p-6 rounded-2xl">
                                        <div>
                                            <p className="text-sm text-foreground/60">Kode Booking</p>
                                            <p className="text-lg font-semibold">{validationResult.bookingCode}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-foreground/60">Nama Penumpang</p>
                                            <p className="text-lg font-semibold">{validationResult.passengerName || 'N/A'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-foreground/60">Nomor Penerbangan</p>
                                                <p className="text-lg font-semibold">{validationResult.flightNumber || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-foreground/60">Jam Keberangkatan</p>
                                                <p className="text-lg font-semibold">
                                                    {validationResult.departureTime
                                                        ? new Date(validationResult.departureTime).toLocaleTimeString('id-ID', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!validationResult.valid && (
                                    <div className="bg-white/30 p-6 rounded-2xl text-left">
                                        <p className="text-lg text-red-600 font-semibold">
                                            {validationResult.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Last Scanned */}
                    {lastScannedCode && (
                        <div className="glass-card p-4 text-center text-sm text-foreground/60">
                            Terakhir dipindai: <span className="font-semibold">{lastScannedCode}</span>
                        </div>
                    )}
                </div>
            </div>
            <Toaster />
        </div>
    );
}

export default function ScannerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ScannerContent />
        </Suspense>
    );
}
