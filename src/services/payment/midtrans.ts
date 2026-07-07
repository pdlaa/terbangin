import crypto from 'crypto';

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const SNAP_BASE = IS_PRODUCTION
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';

const CORE_API_BASE = IS_PRODUCTION
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';

function getServerKey(): string {
    const key = process.env.MIDTRANS_SERVER_KEY;
    if (!key) {
        throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi');
    }
    return key;
}

function authHeader(): string {
    const serverKey = getServerKey();
    return 'Basic ' + Buffer.from(`${serverKey}:`).toString('base64');
}

export function getMidtransClientKey(): string {
    const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!key) {
        throw new Error('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum dikonfigurasi');
    }
    return key;
}

export function getSnapScriptUrl(): string {
    return `${SNAP_BASE}/snap/snap.js`;
}

export interface SnapTransactionParams {
    orderId: string;
    grossAmount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
}

export interface SnapTokenResponse {
    token: string;
    redirect_url: string;
}

export async function createSnapToken(params: SnapTransactionParams): Promise<SnapTokenResponse> {
    const grossAmount = Math.round(params.grossAmount);

    const response = await fetch(`${SNAP_BASE}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: authHeader(),
        },
        body: JSON.stringify({
            transaction_details: {
                order_id: params.orderId,
                gross_amount: grossAmount,
            },
            customer_details: {
                first_name: params.customerName,
                email: params.customerEmail,
                phone: params.customerPhone || '',
            },
            credit_card: {
                secure: true,
            },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.error_messages?.join(', ') || data?.status_message || 'Gagal membuat Snap Token';
        throw new Error(message);
    }

    if (!data.token) {
        throw new Error('Midtrans tidak mengembalikan Snap Token');
    }

    return { token: data.token, redirect_url: data.redirect_url };
}

export interface MidtransNotification {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
    transaction_status: string;
    transaction_id?: string;
    payment_type?: string;
    fraud_status?: string;
}

export function verifyWebhookSignature(notification: MidtransNotification): boolean {
    const serverKey = getServerKey();
    const payload = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
    const expected = crypto.createHash('sha512').update(payload).digest('hex');
    return expected === notification.signature_key;
}

export interface MidtransStatusResponse {
    order_id: string;
    transaction_status: string;
    transaction_id?: string;
    payment_type?: string;
    gross_amount: string;
    status_code: string;
    fraud_status?: string;
}

export async function getTransactionStatus(orderId: string): Promise<MidtransStatusResponse> {
    const response = await fetch(`${CORE_API_BASE}/v2/${encodeURIComponent(orderId)}/status`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader(),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.status_message || 'Gagal mengecek status transaksi Midtrans';
        throw new Error(message);
    }

    return data as MidtransStatusResponse;
}

export function isPaymentSuccess(status: string, fraudStatus?: string): boolean {
    if (status === 'settlement') return true;
    if (status === 'capture' && fraudStatus === 'accept') return true;
    return false;
}

export function isPaymentFailed(status: string): boolean {
    return ['deny', 'cancel', 'expire', 'failure'].includes(status);
}
