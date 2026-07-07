import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/auth-context';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
    title: 'Terbangin - Terbang Tanpa Batas',
    description: 'Sistem pemesanan tiket pesawat online yang modern, aman, dan terpercaya.',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Terbangin',
    },
    icons: {
        icon: '/icons/icon.svg',
        apple: '/icons/icon.svg',
    },
};

export const viewport: Viewport = {
    themeColor: '#2563EB',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body className="font-sans antialiased overflow-x-hidden">
                <AuthProvider>
                    {children}
                </AuthProvider>
                <ServiceWorkerRegister />
            </body>
        </html>
    );
}