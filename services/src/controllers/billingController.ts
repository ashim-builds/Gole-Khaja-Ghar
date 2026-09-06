import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { BillStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { emitEvent, emitPaymentRecorded, emitTableUpdated } from '../lib/socket.js';

export async function generateBill(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tableSessionId, orderId, discountAmount = 0, taxAmount = 0, deliveryCharge = 0 } = req.body;
    const staffId = req.user?.userId || null;
    let validStaffId: string | null = null;
    if (staffId) {
      const userExists = await prisma.user.findUnique({ where: { id: staffId } });
      if (userExists) validStaffId = staffId;
    }

    if (!tableSessionId && !orderId) {
      res.status(400).json({ error: 'Either tableSessionId or orderId is required' });
      return;
    }

    let grossAmount = 0;
    let existingBill = null;

    if (tableSessionId) {
      const session = await prisma.tableSession.findUnique({
        where: { id: tableSessionId },
        include: {
          orders: {
            include: { items: true },
          },
          bill: {
            include: { payments: true },
          },
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Table session not found' });
        return;
      }

      session.orders.forEach((o) => {
        grossAmount += Number(o.totalAmount);
      });

      existingBill = session.bill;
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          bill: { include: { payments: true } },
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      grossAmount = Number(order.totalAmount);
      existingBill = order.bill;
    }

    const discount = Number(discountAmount) || 0;
    const tax = Number(taxAmount) || 0;
    const delivery = Number(deliveryCharge) || 0;
    const netAmount = Math.max(0, grossAmount - discount + delivery + tax);

    let bill;
    if (existingBill) {
      bill = await prisma.bill.update({
        where: { id: existingBill.id },
        data: {
          grossAmount,
          discountAmount: discount,
          taxAmount: tax,
          deliveryCharge: delivery,
          netAmount,
        },
        include: {
          payments: true,
          tableSession: { include: { table: true } },
          order: true,
        },
      });
    } else {
      const billNumber = `INV-${Date.now().toString().slice(-6)}`;
      bill = await prisma.bill.create({
        data: {
          billNumber,
          tableSessionId: tableSessionId || null,
          orderId: orderId || null,
          createdById: validStaffId,
          grossAmount,
          discountAmount: discount,
          taxAmount: tax,
          deliveryCharge: delivery,
          netAmount,
          status: BillStatus.UNPAID,
        },
        include: {
          payments: true,
          tableSession: { include: { table: true } },
          order: true,
        },
      });

      if (tableSessionId) {
        await prisma.tableSession.update({
          where: { id: tableSessionId },
          data: { status: 'BILLED' },
        });
      }
    }

    res.json({ success: true, bill });
  } catch (error) {
    console.error('generateBill error:', error);
    res.status(500).json({ error: 'Failed to generate bill' });
  }
}

export async function recordPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { billId, amount, method = 'CASH', transactionReference, notes } = req.body;
    const staffId = req.user?.userId || null;
    let validStaffId: string | null = null;
    if (staffId) {
      const userExists = await prisma.user.findUnique({ where: { id: staffId } });
      if (userExists) validStaffId = staffId;
    }

    if (!billId || !amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'Bill ID and valid payment amount are required' });
      return;
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        payments: true,
        tableSession: { include: { table: true } },
        order: true,
      },
    });

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const paymentAmount = Number(amount);
    const validMethod = Object.values(PaymentMethod).includes(method) ? method : PaymentMethod.CASH;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          billId,
          recordedById: validStaffId,
          amount: paymentAmount,
          method: validMethod,
          status: PaymentStatus.PAID,
          transactionReference: transactionReference?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      // 2. Sum all completed payments
      const allPayments = await tx.payment.findMany({
        where: { billId, status: PaymentStatus.PAID },
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const netAmount = Number(bill.netAmount);

      let newStatus: BillStatus = BillStatus.PARTIALLY_PAID;
      let isSettled = false;

      if (totalPaid >= netAmount - 0.01) {
        newStatus = BillStatus.PAID;
        isSettled = true;
      }

      // 3. Update Bill
      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          status: newStatus,
          settledAt: isSettled ? new Date() : null,
        },
        include: {
          payments: true,
          tableSession: { include: { table: true } },
          order: true,
        },
      });

      // 4. If fully paid and attached to table session, free the table, complete session & complete orders
      if (isSettled && bill.tableSessionId) {
        await tx.tableSession.update({
          where: { id: bill.tableSessionId },
          data: {
            status: 'COMPLETED',
            closedAt: new Date(),
          },
        });

        if (bill.tableSession?.tableId) {
          await tx.restaurantTable.update({
            where: { id: bill.tableSession.tableId },
            data: { status: 'AVAILABLE' },
          });
        }

        // Complete all orders in this table session
        await tx.order.updateMany({
          where: { tableSessionId: bill.tableSessionId },
          data: { status: 'COMPLETED' },
        });
      }

      // If fully paid and attached to order, complete order
      if (isSettled && bill.orderId) {
        await tx.order.update({
          where: { id: bill.orderId },
          data: { status: 'COMPLETED' },
        });
      }

      return { payment, updatedBill, totalPaid, balanceRemaining: Math.max(0, netAmount - totalPaid), isSettled };
    });

    emitPaymentRecorded({
      billId: bill.id,
      amount: paymentAmount,
      paymentMethod: validMethod,
      status: 'PAID',
    });

    if (bill.tableSession?.tableId) {
      emitTableUpdated({
        tableId: bill.tableSession.tableId,
        tableNumber: bill.tableSession.table?.tableNumber || '',
        status: result.isSettled ? 'AVAILABLE' : 'OCCUPIED',
      });
    }

    emitEvent('order:status_changed', { billId: bill.id });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      ...result,
    });
  } catch (error) {
    console.error('recordPayment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
}

export async function getBillDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
        },
        tableSession: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
            orders: {
              include: { items: true },
            },
          },
        },
        order: {
          include: { items: true },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const totalPaid = bill.payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const balanceRemaining = Math.max(0, Number(bill.netAmount) - totalPaid);

    res.json({
      success: true,
      bill: {
        ...bill,
        totalPaid,
        balanceRemaining,
      },
    });
  } catch (error) {
    console.error('getBillDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
}

export async function listBills(req: Request, res: Response): Promise<void> {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const take = parseInt(limit as string, 10) || 50;
    const skip = (parseInt(page as string, 10) - 1) * take;

    const [bills, totalCount] = await prisma.$transaction([
      prisma.bill.findMany({
        where,
        include: {
          tableSession: { include: { table: true } },
          order: { select: { id: true, orderNumber: true, customerName: true } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      success: true,
      bills,
      totalCount,
      page: parseInt(page as string, 10) || 1,
      totalPages: Math.ceil(totalCount / take),
    });
  } catch (error) {
    console.error('listBills error:', error);
    res.status(500).json({ error: 'Failed to list bills' });
  }
}
