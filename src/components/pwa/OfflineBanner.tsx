'use client';

import { useEffect, useState } from 'react';
import { isOnline } from '@/lib/offline/eticket-store';

export default function OfflineBanner({ fromCache }: { fromCache?: boolean }) {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const update = () => setOffline(!isOnline());
        update();
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    if (!offline && !fromCache) return null;

    return (
        <div className="mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warm/15 border border-warm/30 text-sm">
                <span className="text-lg">📴</span>
                <div>
                    <p className="font-semibold">
                        {fromCache && offline
                            ? 'Mode Offline — E-Ticket dari cache lokal'
                            : fromCache
                              ? 'E-Ticket disimpan lokal — tersedia offline'
                              : 'Anda sedang offline'}
                    </p>
                    <p className="text-foreground/60 text-xs mt-0.5">
                        Tiket ini dapat ditunjukkan di counter check-in tanpa koneksi internet.
                    </p>
                </div>
            </div>
        </div>
    );
}
