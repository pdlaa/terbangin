import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = getSessionUser(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['manager', 'admin'].includes(session.role)) {
            return NextResponse.json({ error: 'Forbidden - Manager or Admin only' }, { status: 403 });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ============================================
        // REVENUE ANALYTICS
        // ============================================

        // Total revenue (all time - only paid bookings)
        const allPayments = await prisma.payment.findMany({
            where: { paymentStatus: 'paid' },
            select: { amount: true, paidAt: true },
        });

        const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        // Monthly revenue (last 30 days)
        const monthlyRevenue = allPayments
            .filter((p) => p.paidAt && new Date(p.paidAt) >= thirtyDaysAgo)
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Weekly revenue (last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyRevenue = allPayments
            .filter((p) => p.paidAt && new Date(p.paidAt) >= sevenDaysAgo)
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Daily revenue (last 30 days)
        const dailyRevenue: { [key: string]: number } = {};
        allPayments
            .filter((p) => p.paidAt && new Date(p.paidAt) >= thirtyDaysAgo)
            .forEach((p) => {
                const dateStr = new Date(p.paidAt!).toLocaleDateString('id-ID');
                dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + Number(p.amount);
            });

        const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, amount]) => ({
            date,
            amount,
        }));

        // ============================================
        // OCCUPANCY RATE ANALYTICS
        // ============================================

        // Get all flights with booking data
        const flights = await prisma.flight.findMany({
            include: {
                _count: {
                    select: {
                        bookings: {
                            where: { status: 'confirmed' },
                        },
                    },
                },
                departureAirport: true,
                arrivalAirport: true,
                airplane: true,
            },
        });

        // Calculate occupancy by route
        const occupancyByRoute: {
            [key: string]: { bookings: number; capacity: number; flights: number };
        } = {};

        flights.forEach((flight) => {
            const route = `${flight.departureAirport.iataCode}-${flight.arrivalAirport.iataCode}`;
            if (!occupancyByRoute[route]) {
                occupancyByRoute[route] = { bookings: 0, capacity: 0, flights: 0 };
            }

            occupancyByRoute[route].bookings += flight._count.bookings;
            occupancyByRoute[route].capacity += flight.airplane.capacity;
            occupancyByRoute[route].flights += 1;
        });

        const topRoutes = Object.entries(occupancyByRoute)
            .map(([route, data]) => ({
                route,
                occupancy: data.capacity > 0 ? (data.bookings / data.capacity) * 100 : 0,
                bookings: data.bookings,
                capacity: data.capacity,
            }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 10);

        const averageOccupancy =
            topRoutes.length > 0
                ? topRoutes.reduce((sum, r) => sum + r.occupancy, 0) / topRoutes.length
                : 0;

        // ============================================
        // ADDITIONAL ADVANCED METRICS FOR MANAGER
        // ============================================

        // 1. Revenue by Airline
        const paymentsForAirline = await prisma.payment.findMany({
            where: { paymentStatus: 'paid' },
            include: {
                booking: {
                    include: {
                        flight: {
                            include: {
                                airline: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const airlineRevenueMap: { [key: string]: number } = {};
        paymentsForAirline.forEach((p) => {
            const name = p.booking.flight.airline.name;
            airlineRevenueMap[name] = (airlineRevenueMap[name] || 0) + Number(p.amount);
        });

        const revenueByAirline = Object.entries(airlineRevenueMap).map(([name, revenue]) => ({
            name,
            revenue,
        }));

        // 2. Occupancy by Seat Class
        const passengersWithSeats = await prisma.passenger.findMany({
            where: {
                booking: {
                    status: { in: ['confirmed', 'used'] }
                }
            },
            include: {
                seat: {
                    select: { class: true }
                }
            }
        });

        const classBookingsMap = { economy: 0, business: 0, first: 0 };
        passengersWithSeats.forEach((p) => {
            if (p.seat) {
                const cls = p.seat.class;
                if (cls === 'economy') classBookingsMap.economy++;
                else if (cls === 'business') classBookingsMap.business++;
                else if (cls === 'first') classBookingsMap.first++;
            }
        });

        const totalClassBookings = classBookingsMap.economy + classBookingsMap.business + classBookingsMap.first;
        const occupancyByClass = [
            { class: 'Economy', count: classBookingsMap.economy, percentage: totalClassBookings > 0 ? (classBookingsMap.economy / totalClassBookings) * 100 : 0 },
            { class: 'Business', count: classBookingsMap.business, percentage: totalClassBookings > 0 ? (classBookingsMap.business / totalClassBookings) * 100 : 0 },
            { class: 'First Class', count: classBookingsMap.first, percentage: totalClassBookings > 0 ? (classBookingsMap.first / totalClassBookings) * 100 : 0 },
        ];

        // ============================================
        // TICKET STATUS ANALYTICS
        // ============================================

        // Expired tickets (no-show)
        const expiredBookings = await prisma.booking.findMany({
            where: { status: 'expired' },
            include: { payment: true },
        });

        const totalExpired = expiredBookings.length;
        const expiredRevenue = expiredBookings
            .filter((b) => b.payment?.paymentStatus === 'paid')
            .reduce((sum, b) => sum + Number(b.payment?.amount || 0), 0);

        // Used tickets (boarding completed)
        const usedBookings = await prisma.booking.findMany({
            where: { status: 'used' },
            include: { payment: true },
        });

        const totalUsed = usedBookings.length;
        const usedRevenue = usedBookings
            .filter((b) => b.payment?.paymentStatus === 'paid')
            .reduce((sum, b) => sum + Number(b.payment?.amount || 0), 0);

        // Conversion rate
        const totalPaidBookings = totalExpired + totalUsed;
        const conversionRate = totalPaidBookings > 0 ? (totalUsed / totalPaidBookings) * 100 : 0;

        return NextResponse.json({
            revenue: {
                daily: dailyRevenueArray,
                weekly: weeklyRevenue,
                monthly: monthlyRevenue,
                total: totalRevenue,
            },
            occupancy: {
                averageRate: averageOccupancy,
                topRoutes,
            },
            tickets: {
                totalExpired,
                expiredRevenue,
                totalUsed,
                usedRevenue,
                conversionRate,
            },
            revenueByAirline,
            occupancyByClass,
        });
    } catch (error: any) {
        console.error('Manager analytics error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
