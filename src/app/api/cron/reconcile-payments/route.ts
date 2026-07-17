import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransactionStatus, isPaymentSuccess, isPaymentFailed } from '@/services/payment/midtrans';
import { processPaymentNotification } from '@/lib/payment-handlers';

/**
 * Cron job endpoint untuk rekonsiliasi pembayaran.
 * 
 * Cara pakai:
 *   1. Deploy ke production, lalu setup cron scheduler (cron-job.org, GitHub Actions,
 *      Task Scheduler Windows, dll) untuk memanggil endpoint ini setiap 15-30 menit.
 *   2. Di development: panggil manual dengan curl:
 *      curl -X POST http://localhost:3000/api/cron/reconcile-payments
 * 
 * Security: Endpoint ini hanya bisa diakses via POST request dengan
 * header Authorization yang berisi CRON_SECRET yang sama dengan .env
 */
export async function POST(request: NextRequest) {
    try {
        // Simple security check — prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET || 'dev-cron-secret';
        
        if (authHeader !== `Bearer ${expectedToken}` && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        console.log(`🔄 [Cron] Payment reconciliation started at ${now.toISOString()}`);

        // Find pending bookings whose payment window has expired (more than 15 minutes ago)
        const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
        
        const staleBookings = await prisma.booking.findMany({
            where: {
                status: 'pending',
                expiresAt: { lte: fifteenMinAgo },
            },
            include: {
                payment: true,
            },
            take: 50, // Process max 50 per run
        });

        console.log(`📊 [Cron] Found ${staleBookings.length} stale pending bookings`);

        let processed = 0;
        let confirmed = 0;
        let cancelled = 0;
        let errors = 0;

        for (const booking of staleBookings) {
            try {
                // Try to get updated status from Midtrans
                const status = await getTransactionStatus(booking.bookingCode);
                
                const success = isPaymentSuccess(status.transaction_status, status.fraud_status);
                const failed = isPaymentFailed(status.transaction_status);

                if (success) {
                    // Payment actually succeeded — webhook must have been missed
                    const result = await processPaymentNotification({
                        orderId: booking.bookingCode,
                        transactionStatus: status.transaction_status,
                        transactionId: status.transaction_id,
                        paymentMethod: status.payment_type,
                        fraudStatus: status.fraud_status,
                    });
                    if (result.action === 'confirmed') {
                        confirmed++;
                        console.log(`✅ [Cron] Booking ${booking.bookingCode} → CONFIRMED (missed webhook)`);
                    }
                } else if (failed) {
                    // Payment definitely failed — cancel and release seats
                    const result = await processPaymentNotification({
                        orderId: booking.bookingCode,
                        transactionStatus: status.transaction_status,
                        transactionId: status.transaction_id,
                        paymentMethod: status.payment_type,
                        fraudStatus: status.fraud_status,
                    });
                    if (result.action === 'cancelled') {
                        cancelled++;
                        console.log(`❌ [Cron] Booking ${booking.bookingCode} → CANCELLED`);
                    }
                } else {
                    // Still pending in Midtrans too — check if expired past payment window
                    if (booking.expiresAt < now) {
                        // Booking expired — cancel it
                        const { cancelBookingAndReleaseSeats } = await import('@/lib/payment-handlers');
                        await cancelBookingAndReleaseSeats(booking.id);
                        cancelled++;
                        console.log(`⏰ [Cron] Booking ${booking.bookingCode} → CANCELLED (expired)`);
                    }
                }

                processed++;
            } catch (error: any) {
                // If Midtrans API call fails (e.g. transaction not found), 
                // and the booking is well past expiry, just cancel it
                console.error(`⚠️ [Cron] Error processing ${booking.bookingCode}:`, error.message);
                
                if (booking.expiresAt < now) {
                    try {
                        const { cancelBookingAndReleaseSeats } = await import('@/lib/payment-handlers');
                        await cancelBookingAndReleaseSeats(booking.id);
                        cancelled++;
                        console.log(`⏰ [Cron] Booking ${booking.bookingCode} → CANCELLED (force expired)`);
                    } catch (cancelErr) {
                        errors++;
                    }
                } else {
                    errors++;
                }
            }
        }

        console.log(`✅ [Cron] Done. Processed=${processed} Confirmed=${confirmed} Cancelled=${cancelled} Errors=${errors}`);

        return NextResponse.json({
            success: true,
            stats: {
                processed,
                confirmed,
                cancelled,
                errors,
                totalStale: staleBookings.length,
            },
            timestamp: now.toISOString(),
        });
    } catch (error: any) {
        console.error('❌ [Cron] Fatal error:', error);
        return NextResponse.json(
            { error: error.message || 'Cron job failed' },
            { status: 500 }
        );
    }
}