import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen animated-sky flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="glass-card p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}