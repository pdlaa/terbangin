import { NextResponse } from 'next/server';
import { getMidtransClientKey, getSnapScriptUrl } from '@/services/payment/midtrans';

export async function GET() {
    try {
        return NextResponse.json({
            clientKey: getMidtransClientKey(),
            snapScriptUrl: getSnapScriptUrl(),
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Konfigurasi Midtrans tidak tersedia' },
            { status: 503 }
        );
    }
}
