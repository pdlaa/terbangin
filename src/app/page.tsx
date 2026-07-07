import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedBackground from '@/components/common/AnimatedBackground';
import FlightSearch from '@/components/common/FlightSearch';
import GlassCard from '@/components/ui/GlassCard';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/avatar';

export default function Home() {
    return (
        <main className="min-h-screen relative">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 animated-sky">
                <AnimatedBackground />

                <div className="relative z-10 max-w-6xl mx-auto w-full">
                    {/* Hero Content */}
                    <div className="text-center mb-12 animate-fade-in-down">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 mb-6 animate-bounce-soft">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-foreground/70">Lebih dari 10.000+ penerbangan tersedia</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-balance">
                            Terbang <span className="gradient-text">Tanpa Batas</span>
                            <br />
                            Bersama <span className="gradient-text">Terbangin</span>
                        </h1>

                        <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                            Rasakan pengalaman booking tiket pesawat yang modern, aman, dan menyenangkan.
                            Destinasi impianmu hanya satu klik away. ✈️
                        </p>
                    </div>

                    {/* Flight Search Card */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <FlightSearch />
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto stagger-children">
                        {[
                            { value: '500+', label: 'Destinasi' },
                            { value: '50+', label: 'Maskapai' },
                            { value: '10K+', label: 'Penumpang' },
                            { value: '4.9', label: 'Rating' },
                        ].map((stat, i) => (
                            <GlassCard key={i} className="p-6 text-center" delay={i * 100}>
                                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                                <div className="text-sm text-foreground/60">{stat.label}</div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-soft">
                    <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1">
                        <div className="w-1.5 h-3 rounded-full bg-sky animate-float-fast" />
                    </div>
                </div>
            </section>

            {/* FEATURED DESTINATIONS */}
            <section id="destinations" className="relative py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-sky/10 text-sky text-sm font-semibold mb-4">
                            ️ Destinasi Populer
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                            Jelajahi <span className="gradient-text">Destinasi Impian</span>
                        </h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            Temukan tempat-tempat menakjubkan yang siap kamu jelajahi dengan harga terbaik.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                        {[
                            { city: 'Bali', country: 'Indonesia', price: 'Rp 850.000', emoji: '🏝️', color: 'from-cyan/20 to-sky/20' },
                            { city: 'Tokyo', country: 'Jepang', price: 'Rp 4.500.000', emoji: '🗼', color: 'from-pink/20 to-rose/20' },
                            { city: 'Seoul', country: 'Korea', price: 'Rp 3.800.000', emoji: '🇰🇷', color: 'from-blue/20 to-indigo/20' },
                            { city: 'Singapura', country: 'Singapura', price: 'Rp 1.200.000', emoji: '🦁', color: 'from-red/20 to-orange/20' },
                            { city: 'Bangkok', country: 'Thailand', price: 'Rp 1.500.000', emoji: '', color: 'from-yellow/20 to-amber/20' },
                            { city: 'Melbourne', country: 'Australia', price: 'Rp 5.200.000', emoji: '🦘', color: 'from-green/20 to-emerald/20' },
                        ].map((dest, i) => (
                            <GlassCard key={i} hover className="p-6 group cursor-pointer" delay={i * 100}>
                                <div className={`h-48 rounded-2xl bg-gradient-to-br ${dest.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-500`}>
                                    <span className="text-7xl">{dest.emoji}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{dest.city}</h3>
                                        <p className="text-sm text-foreground/60">{dest.country}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-foreground/50 mb-1">Mulai dari</div>
                                        <div className="text-lg font-bold text-sky">{dest.price}</div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link href="/customer/flights" className="glass-button px-8 py-3 inline-flex items-center gap-2 ripple">
                            Lihat Semua Destinasi
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* AIRLINE PARTNERS */}
            <section id="airlines" className="relative py-24 px-6 sky-gradient">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan/10 text-cyan text-sm font-semibold mb-4">
                            🤝 Partner Maskapai
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                            Bekerja Sama dengan <span className="gradient-text">Maskapai Terbaik</span>
                        </h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            Kami bermitra dengan maskapai terpercaya untuk memberikan pengalaman terbang terbaik.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 stagger-children">
                        {[
                            { name: 'Garuda', code: 'GA', color: 'from-blue-500 to-blue-700' },
                            { name: 'Lion Air', code: 'JT', color: 'from-red-500 to-red-700' },
                            { name: 'Citilink', code: 'QG', color: 'from-green-500 to-green-700' },
                            { name: 'Batik Air', code: 'ID', color: 'from-amber-500 to-amber-700' },
                            { name: 'AirAsia', code: 'QZ', color: 'from-red-600 to-red-800' },
                            { name: 'Singapore Airlines', code: 'SQ', color: 'from-yellow-500 to-yellow-700' },
                        ].map((airline, i) => (
                            <GlassCard key={i} hover className="p-6 text-center" delay={i * 100}>
                                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${airline.color} flex items-center justify-center mb-3 shadow-lg`}>
                                    <span className="text-white font-bold text-lg">{airline.code}</span>
                                </div>
                                <div className="text-sm font-semibold">{airline.name}</div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* PROMOTIONS */}
            <section id="promo" className="relative py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-warm/10 text-warm text-sm font-semibold mb-4">
                            🎉 Promo Spesial
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                            Hemat Lebih dengan <span className="gradient-text">Promo Terbangin</span>
                        </h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            Dapatkan penawaran eksklusif dan diskon spesial untuk perjalanan impianmu.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                        {[
                            { title: 'Diskon 30%', desc: 'Penerbangan Domestik', code: 'TERBANG30', color: 'from-sky to-cyan', emoji: '🇩' },
                            { title: 'Cashback 500K', desc: 'Penerbangan Internasional', code: 'FLYINTL', color: 'from-cyan to-blue', emoji: '🌏' },
                            { title: 'Gratis Bagasi', desc: 'Semua Penerbangan', code: 'FREEBAG', color: 'from-warm to-orange', emoji: '🧳' },
                        ].map((promo, i) => (
                            <GlassCard key={i} hover className="p-8 relative overflow-hidden" delay={i * 100}>
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${promo.color} opacity-10 rounded-full blur-2xl`} />
                                <div className="relative">
                                    <div className="text-5xl mb-4">{promo.emoji}</div>
                                    <h3 className="text-2xl font-bold mb-2">{promo.title}</h3>
                                    <p className="text-foreground/60 mb-4">{promo.desc}</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky/10 to-cyan/10 border border-sky/20">
                                        <span className="text-xs text-foreground/60">Kode:</span>
                                        <span className="font-bold text-sky">{promo.code}</span>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="testimonials" className="relative py-24 px-6 sky-gradient">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-sky/10 text-sky text-sm font-semibold mb-4">
                            💬 Testimoni
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                            Kata <span className="gradient-text">Mereka</span> Tentang Terbangin
                        </h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            Ribuan penumpang telah mempercayakan perjalanan mereka bersama kami.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                        {[
                            { name: 'Sarah Wijaya', role: 'Travel Blogger', text: 'Terbangin membuat booking tiket jadi super mudah! UI-nya cantik dan prosesnya cepat banget. Love it! 💙', rating: 5 },
                            { name: 'Budi Santoso', role: 'Business Traveler', text: 'Sering terbang untuk kerja, Terbangin selalu jadi pilihan utama. Harga kompetitif dan customer service responsif.', rating: 5 },
                            { name: 'Anisa Rahman', role: 'Mahasiswi', text: 'Promonya sering banget! Bisa hemat banyak buat jalan-jalan sama teman-teman. Recommended! ✈️', rating: 5 },
                        ].map((testi, i) => (
                            <GlassCard key={i} hover className="p-8" delay={i * 100}>
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testi.rating)].map((_, j) => (
                                        <svg key={j} className="w-5 h-5 text-warm" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-foreground/80 mb-6 leading-relaxed">"{testi.text}"</p>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={getAvatarUrl(testi.name)}
                                        alt={testi.name}
                                        className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm"
                                    />
                                    <div>
                                        <div className="font-semibold">{testi.name}</div>
                                        <div className="text-sm text-foreground/60">{testi.role}</div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <GlassCard className="p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-sky/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan/20 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className="text-6xl mb-6 animate-bounce-soft">✈️</div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                                Siap untuk <span className="gradient-text">Terbang</span>?
                            </h2>
                            <p className="text-lg text-foreground/60 mb-8 max-w-xl mx-auto">
                                Bergabung dengan ribuan penumpang bahagia. Daftar sekarang dan dapatkan promo eksklusif untuk penerbangan pertamamu!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/auth/register" className="glass-button px-8 py-4 text-lg ripple">
                                    Daftar Gratis
                                </Link>
                                <Link href="/auth/login" className="px-8 py-4 text-lg font-semibold text-sky hover:bg-sky/5 rounded-2xl transition-colors">
                                    Sudah punya akun? Login
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </section>

            <Footer />
        </main>
    );
}