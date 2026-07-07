import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Suspense fallback={<div className="rounded-3xl bg-slate-950/10 p-10 text-center">Loading...</div>}>
                    <LoginClient />
                </Suspense>
            </div>
        </div>
    );
}
