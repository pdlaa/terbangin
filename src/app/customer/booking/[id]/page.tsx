'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import FlightSummary from '@/components/booking/FlightSummary';
import PassengerForm, { PassengerFormData } from '@/components/booking/PassengerForm';
import SeatPicker from '@/components/booking/SeatPicker';
import { useAuth } from '@/context/auth-context';

interface Flight {
    id: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    price: number | string;
    availableSeats: number;
    airline: {
        code: string;
        name: string;
    };
    departureAirport: {
        iataCode: string;
        city: string;
        name: string;
    };
    arrivalAirport: {
        iataCode: string;
        city: string;
        name: string;
    };
    airplane: {
        model: string;
    };
}

interface Seat {
    id: string;
    seatNumber: string;
    class: string;
    isAvailable: boolean;
}

const MAX_PASSENGERS = 6;
const emptyPassenger = (): PassengerFormData => ({
    fullName: '',
    gender: '',
    birthDate: '',
    passportNumber: '',
});

function classMultiplier(seatClass?: string, flight?: any) {
    if (seatClass === 'business') return Number(flight?.priceMultiplierBusiness || 1.5);
    if (seatClass === 'first') return Number(flight?.priceMultiplierFirst || 2);
    return 1;
}

function BookingContent() {
    const params = useParams();
    const router = useRouter();
    const flightId = params?.id as string;
    const { user, loading: authLoading } = useAuth();

    const [flight, setFlight] = useState<Flight | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [passengerCount, setPassengerCount] = useState(1);
    const [passengers, setPassengers] = useState<PassengerFormData[]>([emptyPassenger()]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [contact, setContact] = useState({ email: '', phone: '' });

    // Require a real, logged-in, verified user before booking anything.
    useEffect(() => {
        if (!authLoading && !user && flightId) {
            toast.error('Silakan login terlebih dahulu untuk memesan tiket');
            router.push(`/auth/login?redirect=/customer/booking/${flightId}`);
        }
    }, [authLoading, user, router, flightId]);

    useEffect(() => {
        if (user?.email) {
            setContact((prev) => ({ ...prev, email: prev.email || user.email }));
        }
    }, [user]);

    useEffect(() => {
        if (flightId) {
            loadFlightData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightId]);

    const loadFlightData = async () => {
        try {
            setLoading(true);

            const flightRes = await fetch(`/api/flight-detail?id=${flightId}`);
            if (!flightRes.ok) {
                const errorData = await flightRes.json().catch(() => ({}));
                throw new Error(errorData.error || `Flight not found (ID: ${flightId})`);
            }
            const flightData = await flightRes.json();
            setFlight(flightData.flight);

            const seatsRes = await fetch(`/api/flights/${flightId}/seats`);
            if (seatsRes.ok) {
                const seatsData = await seatsRes.json();
                setSeats(seatsData.seats || []);
            }
        } catch (error: any) {
            console.error('Error loading flight:', error);
            toast.error(error.message || 'Gagal memuat data penerbangan');
        } finally {
            setLoading(false);
        }
    };

    const handlePassengerCountChange = (count: number) => {
        const availableCap = flight ? Math.min(MAX_PASSENGERS, flight.availableSeats) : MAX_PASSENGERS;
        const nextCount = Math.max(1, Math.min(count, availableCap));
        setPassengerCount(nextCount);
        setPassengers((prev) => {
            const next = [...prev];
            while (next.length < nextCount) next.push(emptyPassenger());
            return next.slice(0, nextCount);
        });
        setSelectedSeats((prev) => prev.slice(0, nextCount));
    };

    const handlePassengerFieldChange = (index: number, field: keyof PassengerFormData, value: string) => {
        setPassengers((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleToggleSeat = (seatId: string) => {
        setSelectedSeats((prev) => {
            if (prev.includes(seatId)) {
                return prev.filter((id) => id !== seatId);
            }
            if (prev.length >= passengerCount) {
                toast.error(`Anda hanya memilih ${passengerCount} penumpang. Batalkan pilihan kursi lain dulu.`);
                return prev;
            }
            return [...prev, seatId];
        });
    };

    const seatById = (id: string) => seats.find((s) => s.id === id);

    const totalPrice = flight
        ? selectedSeats.reduce((sum, seatId) => sum + Number(flight.price) * classMultiplier(seatById(seatId)?.class, flight), 0)
        : 0;

    const validateForm = (): string | null => {
        if (selectedSeats.length !== passengerCount) {
            return `Silakan pilih ${passengerCount} kursi (baru dipilih ${selectedSeats.length})`;
        }
        if (!contact.email || !contact.phone) {
            return 'Mohon lengkapi email dan nomor telepon kontak';
        }
        for (let i = 0; i < passengers.length; i++) {
            const p = passengers[i];
            if (!p.fullName || !p.gender || !p.birthDate || !p.passportNumber) {
                return `Mohon lengkapi seluruh data Penumpang ${i + 1}`;
            }
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flight || !user) return;

        const validationError = validateForm();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                flightId,
                contactEmail: contact.email,
                contactPhone: contact.phone,
                passengers: passengers.map((p, i) => ({
                    seatId: selectedSeats[i],
                    fullName: p.fullName,
                    gender: p.gender,
                    birthDate: p.birthDate,
                    passportNumber: p.passportNumber,
                })),
            };

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Booking gagal');
            }

            toast.success('Booking berhasil dibuat! Lanjutkan ke pembayaran.');
            router.push(`/customer/payment/${data.booking.id}`);
        } catch (error: any) {
            console.error('Booking error:', error);
            toast.error(error.message || 'Terjadi kesalahan saat booking');
            // Seats may have changed (e.g. someone else booked one) — refresh.
            loadFlightData();
            setSelectedSeats([]);
        } finally {
            setSubmitting(false);
        }
    };

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
                    <p className="text-foreground/60">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect effect above is already firing; render nothing meaningful here.
        return null;
    }

    if (!flight) {
        return (
            <div className="min-h-screen sky-gradient flex items-center justify-center p-4">
                <div className="text-center glass-card p-8 max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold mb-2">Penerbangan Tidak Ditemukan</h2>
                    <p className="text-foreground/60 mb-6">
                        Maaf, penerbangan yang Anda pilih tidak tersedia.
                    </p>
                    <button
                        onClick={() => router.push('/customer/flights')}
                        className="glass-button px-6 py-3 ripple"
                    >
                        Cari Penerbangan Lain
                    </button>
                </div>
            </div>
        );
    }

    const maxSelectable = Math.min(MAX_PASSENGERS, flight.availableSeats || 1);

    return (
        <div className="min-h-screen sky-gradient">
            <Navbar />

            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            Booking <span className="gradient-text">Penerbangan</span>
                        </h1>
                        <p className="text-foreground/60">Lengkapi data untuk melanjutkan pemesanan</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <FlightSummary flight={flight} />

                                {/* Contact info */}
                                <div className="glass-card p-6">
                                    <h3 className="font-bold text-lg mb-4">Kontak Pemesan</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={contact.email}
                                                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Nomor Telepon</label>
                                            <input
                                                type="tel"
                                                value={contact.phone}
                                                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                                                placeholder="08123456789"
                                                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-foreground/60 mt-3">
                                        ✈️ E-ticket akan dikirim ke email kontak ini
                                    </p>
                                </div>

                                {/* Passenger count */}
                                <div className="glass-card p-6">
                                    <h3 className="font-bold text-lg mb-4">Jumlah Penumpang</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePassengerCountChange(passengerCount - 1)}
                                            className="w-10 h-10 rounded-full bg-white/60 border border-foreground/10 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="text-xl font-bold w-8 text-center">{passengerCount}</span>
                                        <button
                                            type="button"
                                            onClick={() => handlePassengerCountChange(passengerCount + 1)}
                                            className="w-10 h-10 rounded-full bg-white/60 border border-foreground/10 font-bold"
                                        >
                                            +
                                        </button>
                                        <span className="text-xs text-foreground/60 ml-2">
                                            Maks. {maxSelectable} penumpang (sisa kursi tersedia)
                                        </span>
                                    </div>
                                </div>

                                {passengers.map((p, i) => (
                                    <PassengerForm
                                        key={i}
                                        index={i}
                                        data={p}
                                        seatNumber={seatById(selectedSeats[i] || '')?.seatNumber}
                                        onChange={handlePassengerFieldChange}
                                    />
                                ))}
                            </div>

                            <div className="space-y-6">
                                <SeatPicker
                                    flightId={flightId}
                                    selectedSeats={selectedSeats}
                                    maxSeats={passengerCount}
                                    onSeatToggle={(seatId, seatNumber, seatClass) => handleToggleSeat(seatId)}
                                />

                                <div className="glass-card p-6 sticky top-24">
                                    <h3 className="font-bold text-lg mb-4">Ringkasan Booking</h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-foreground/60">Harga tiket ({selectedSeats.length}x)</span>
                                            <span className="font-semibold">
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0,
                                                }).format(totalPrice)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-foreground/60">Pajak & fees</span>
                                            <span className="font-semibold">Included</span>
                                        </div>
                                        <div className="border-t border-foreground/10 pt-3 flex justify-between">
                                            <span className="font-semibold">Total</span>
                                            <span className="text-2xl font-bold gradient-text">
                                                {new Intl.NumberFormat('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    minimumFractionDigits: 0,
                                                }).format(totalPrice)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || selectedSeats.length !== passengerCount}
                                        className="w-full glass-button py-3.5 ripple disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                                    </button>

                                    {selectedSeats.length !== passengerCount && (
                                        <p className="text-xs text-center text-foreground/60 mt-2">
                                            Pilih {passengerCount} kursi untuk melanjutkan
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <Toaster />
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-sky animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}