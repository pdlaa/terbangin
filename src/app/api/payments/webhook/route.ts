import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, type MidtransNotification } from '@/services/payment/midtrans';
import { processPaymentNotification } from '@/lib/payment-handlers';

export async function POST(request: NextRequest) {
    try {
        const notification = (await request.json()) as MidtransNotification;

        if (!notification.order_id || !notification.signature_key) {
            return NextResponse.json({ error: 'Payload webhook tidak valid' }, { status: 400 });
        }

        if (!verifyWebhookSignature(notification)) {
            console.error('Invalid Midtrans webhook signature for order:', notification.order_id);
            return NextResponse.json({ error: 'Signature tidak valid' }, { status: 403 });
        }

        const result = await processPaymentNotification({
            orderId: notification.order_id,
            transactionStatus: notification.transaction_status,
            transactionId: notification.transaction_id,
            paymentMethod: notification.payment_type,
            fraudStatus: notification.fraud_status,
        });

        console.log(`Webhook processed: order=${notification.order_id} status=${notification.transaction_status} action=${result.action}`);

        return NextResponse.json({ message: 'OK', action: result.action });
    } catch (error) {
        console.error('Payment webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
