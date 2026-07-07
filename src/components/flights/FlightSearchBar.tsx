'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AirportAutocomplete from '@/components/flights/AirportAutocomplete';

export default function FlightSearchBar() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        from: '',
        to: '',
        date: '',
        passengers: '1',
        class: 'economy',
    });

    const today = new Date().toISOString().split('T')[0];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.from || !formData.to || !formData.date) {
            alert('Mohon lengkapi semua field');
            return;
        }

        if (formData.from === formData.to) {
            alert('Kota asal dan tujuan tidak boleh sama');
            return;
        }

        const params = new URLSearchParams({
            from: formData.from,
            to: formData.to,
            date: formData.date,
            passengers: formData.passengers,
            class: formData.class,
        });
        router.push(`/customer/flights?${params.toString()}`);
    };

    const handleSwap = () => {
        setFormData({
            ...formData,
            from: formData.to,
            to: formData.from,
        });
    };

    const classOptions = [
        { value: 'economy', label: 'Ekonomi', icon: '🛫', desc: 'Harga terjangkau' },
        { value: 'business', label: 'Bisnis', icon: '💼', desc: 'Kenyamanan ekstra' },
        { value: 'first', label: 'First Class', icon: '👑', desc: 'Pengalaman premium' },
    ] as const;

    return (
        <form onSubmit={handleSearch} className="glass-card p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky to-cyan flex items-center justify-center shadow-glow">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Cari Penerbangan</h3>
                    <p className="text-sm text-foreground/60">Temukan penerbangan terbaik untuk Anda</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
                <AirportAutocomplete
                    label="Dari"
                    value={formData.from}
                    onChange={(value: string) => setFormData({ ...formData, from: value })}
                    placeholder="Kota asal"
                    excludeCode={formData.to}
                    icon={
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                        </svg>
                    }
                />

                <button
                    type="button"
                    onClick={handleSwap}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-foreground/10 shadow-soft flex items-center justify-center hover:scale-110 hover:shadow-glow transition-all group"
                    title="Tukar kota asal dan tujuan"
                >
                    <svg className="w-5 h-5 text-sky group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                </button>

                <AirportAutocomplete
                    label="Ke"
                    value={formData.to}
                    onChange={(value: string) => setFormData({ ...formData, to: value })}
                    placeholder="Kota tujuan"
                    excludeCode={formData.from}
                    icon={
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-foreground/70">
                        Tanggal Berangkat
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <input
                            type="date"
                            value={formData.date}
                            min={today}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm transition-all"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-foreground/70">
                        Jumlah Penumpang
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <select
                            value={formData.passengers}
                            onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all appearance-none cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <option key={num} value={num}>
                                    {num} Penumpang
                                </option>
                            ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-semibold mb-3 uppercase tracking-wider text-foreground/70">
                    Kelas Penerbangan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {classOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, class: option.value })}
                            className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                                formData.class === option.value
                                    ? 'border-sky bg-gradient-to-br from-sky/10 to-cyan/10 shadow-glow'
                                    : 'border-white/60 bg-white/30 hover:bg-white/50 hover:border-sky/30'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{option.icon}</div>
                                <div>
                                    <div className="font-semibold text-foreground">{option.label}</div>
                                    <div className="text-xs text-foreground/60">{option.desc}</div>
                                </div>
                            </div>
                            {formData.class === option.value && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                className="w-full glass-button py-4 px-6 text-lg font-semibold ripple flex items-center justify-center gap-3"
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                Cari Penerbangan
            </button>
        </form>
    );
}