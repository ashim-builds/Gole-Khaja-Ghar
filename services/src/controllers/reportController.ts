import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export async function getDailySalesSummary(_req: Request, res: Response): Promise<void> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Payments received today
    const paymentsToday = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const totalRevenueToday = paymentsToday.reduce((sum, p) => sum + Number(p.amount), 0);

    // Breakdown by payment method
    const paymentBreakdown: Record<string, number> = {};
    paymentsToday.forEach((p) => {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + Number(p.amount);
    });

    // 2. Orders created today
    const ordersToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        items: true,
      },
    });

    let dineInOrders = 0;
    let deliveryOrders = 0;
    let dineInRevenue = 0;
    let deliveryRevenue = 0;

    ordersToday.forEach((o) => {
      if (o.orderType === 'DINE_IN') {
        dineInOrders++;
        dineInRevenue += Number(o.totalAmount);
      } else {
        deliveryOrders++;
        deliveryRevenue += Number(o.totalAmount);
      }
    });

    // 3. Top selling items today
    const itemSales: Record<string, { name: string; count: number; revenue: number }> = {};
    ordersToday.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productName;
        if (!itemSales[key]) {
          itemSales[key] = { name: key, count: 0, revenue: 0 };
        }
        itemSales[key].count += item.quantity;
        itemSales[key].revenue += Number(item.calculatedPrice) * item.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Tables Status
    const allTables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      include: { sessions: { where: { status: 'ACTIVE' } } },
    });

    const totalTables = allTables.length;
    const occupiedTables = allTables.filter((t) => t.sessions.length > 0).length;
    const availableTables = totalTables - occupiedTables;

    // 5. Active KOTs count
    const activeKotsCount = await prisma.kotTicket.count({
      where: { status: { in: ['QUEUED', 'PREPARING', 'READY'] } },
    });

    res.json({
      success: true,
      summary: {
        totalRevenueToday,
        totalOrdersToday: ordersToday.length,
        dineInOrders,
        deliveryOrders,
        dineInRevenue,
        deliveryRevenue,
        paymentBreakdown,
        topItems,
        totalTables,
        occupiedTables,
        availableTables,
        activeKotsCount,
      },
    });
  } catch (error) {
    console.error('getDailySalesSummary error:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
}

export async function getSalesAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by Date string YYYY-MM-DD
    const dailyMap: Record<string, { date: string; revenue: number; transactions: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr, revenue: 0, transactions: 0 };
    }

    payments.forEach((p) => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].revenue += Number(p.amount);
        dailyMap[dateStr].transactions += 1;
      }
    });

    const chartData = Object.values(dailyMap);

    res.json({
      success: true,
      chartData,
    });
  } catch (error) {
    console.error('getSalesAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
}
