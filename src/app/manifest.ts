import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Terbangin - Pemesanan Tiket Pesawat',
        short_name: 'Terbangin',
        description: 'Sistem pemesanan tiket pesawat online. Akses E-Ticket offline di bandara.',
        start_url: '/',
        display: 'standalone',
        background_color: '#F0F9FF',
        theme_color: '#2563EB',
        orientation: 'portrait',
        categories: ['travel', 'transportation'],
        icons: [
            {
                src: '/icons/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icons/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    };
}
