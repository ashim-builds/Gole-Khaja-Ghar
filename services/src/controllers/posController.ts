import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendPushToAdmin } from '../integrations/webpush.js';
import { emitTableUpdated, emitKotStatusChanged, emitEvent } from '../lib/socket.js';

export async function createTableOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tableSessionId, items, notes } = req.body;
    const waiterId = req.user?.userId || null;

    if (!tableSessionId) {
      res.status(400).json({ error: 'tableSessionId is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item' });
      return;
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: tableSessionId },
      include: { table: true },
    });

    if (!session || (session.status !== 'ACTIVE' && session.status !== 'BILLED')) {
      res.status(400).json({ error: 'Table session is not active or not found' });
      return;
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const qty = parseInt(item.quantity || 1, 10);
      const calculatedPrice = Number(item.calculatedPrice || item.unitPrice || 0);
      subtotal += calculatedPrice * qty;

      return {
        productId: item.productId || null,
        productName: item.productName || item.name || 'Khaja Item',
        variantName: item.variantName || null,
        selectedWeightInGrams: item.selectedWeightInGrams ? parseInt(item.selectedWeightInGrams, 10) : null,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null,
        calculatedPrice: calculatedPrice,
        quantity: qty,
        specialInstructions: item.specialInstructions ? String(item.specialInstructions).trim() : null,
      };
    });

    const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

    // Check stock for tracked items
    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && product.trackStock) {
          const qty = parseInt(item.quantity || 1, 10);
          if (product.stockQuantity < qty) {
            res.status(400).json({
              error: product.stockQuantity <= 0
                ? `"${product.name}" is currently out of stock.`
                : `Only ${product.stockQuantity} units remaining for "${product.name}".`,
            });
            return;
          }
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Dine-In Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: waiterId,
          tableSessionId: session.id,
          orderSource: 'WAITER',
          orderType: 'DINE_IN',
          status: 'CONFIRMED',
          subtotalAmount: subtotal,
          deliveryCharge: 0,
          discountAmount: 0,
          totalAmount: subtotal,
          customerName: `Table ${session.table.tableNumber}`,
          customerPhone: 'DINE-IN',
          notes: notes?.trim() || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Deduct stock for tracked products
      for (const item of orderItemsData) {
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod && prod.trackStock) {
            const newStock = Math.max(0, prod.stockQuantity - item.quantity);
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: newStock,
                isAvailable: newStock > 0 ? prod.isAvailable : false,
              },
            });
          }
        }
      }

      // 2. Create Kitchen Order Ticket (KOT)
      const kotTicket = await tx.kotTicket.create({
        data: {
          orderId: order.id,
          tableSessionId: session.id,
          status: 'QUEUED',
          notes: notes?.trim() || null,
          items: {
            create: order.items.map((oi) => {
              let details = oi.variantName || '';
              if (oi.selectedWeightInGrams) {
                details = `${oi.selectedWeightInGrams}g`;
              }
              if (oi.specialInstructions) {
                details = details ? `${details} (${oi.specialInstructions})` : `(${oi.specialInstructions})`;
              }

              return {
                orderItemId: oi.id,
                itemName: oi.productName,
                itemDetails: details || null,
                quantity: oi.quantity,
                status: 'PENDING',
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      // 3. Create Kitchen/Admin Notification
      await tx.notification.create({
        data: {
          targetRole: 'KITCHEN',
          recipientType: 'ROLE_BROADCAST',
          type: 'KOT_NEW',
          title: `New KOT #${kotTicket.ticketNumber} - Table ${session.table.tableNumber}`,
          body: `${order.items.length} items sent by staff.`,
          linkUrl: '/kitchen',
          metadata: {
            kotTicketId: kotTicket.id,
            ticketNumber: kotTicket.ticketNumber,
            tableNumber: session.table.tableNumber,
            tableSessionId: session.id,
          },
        },
      });

      return { order, kotTicket };
    });

    // Broadcast live socket updates
    emitTableUpdated({
      tableId: session.tableId,
      tableNumber: session.table.tableNumber,
      status: 'OCCUPIED',
    });

    emitKotStatusChanged({
      kotTicketId: result.kotTicket.id,
      ticketNumber: result.kotTicket.ticketNumber,
      status: 'QUEUED',
      tableNumber: session.table.tableNumber,
      tableSessionId: session.id,
      items: result.order.items,
    });

    emitEvent('order:status_changed', { tableId: session.tableId, orderId: result.order.id });

    // Send push alert
    sendPushToAdmin({
      title: `New KOT - Table ${session.table.tableNumber}`,
      body: `Ticket #${result.kotTicket.ticketNumber} has arrived in the kitchen.`,
      url: '/kitchen',
    }).catch((err) => console.error('Kitchen push alert error:', err));

    res.status(201).json({
      success: true,
      message: 'Order created and sent to kitchen successfully',
      order: result.order,
      kotTicket: result.kotTicket,
    });
  } catch (error) {
    console.error('createTableOrder error:', error);
    res.status(500).json({ error: 'Failed to create table order' });
  }
}

export async function getTableSessionDetails(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        waiter: { select: { id: true, name: true, phone: true } },
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        kotTickets: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bill: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Table session not found' });
      return;
    }

    let totalAmount = 0;
    session.orders.forEach((ord) => {
      totalAmount += Number(ord.totalAmount);
    });

    res.json({
      success: true,
      session: {
        ...session,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('getTableSessionDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
}

export async function closeTableSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { table: true, bill: true },
    });

    if (!session) {
      res.status(404).json({ error: 'Table session not found' });
      return;
    }

    await prisma.$transaction([
      prisma.tableSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          closedAt: new Date(),
        },
      }),
      prisma.restaurantTable.update({
        where: { id: session.tableId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    emitTableUpdated({
      tableId: session.tableId,
      tableNumber: session.table?.tableNumber || '',
      status: 'AVAILABLE',
    });

    res.json({ success: true, message: 'Table session closed successfully' });
  } catch (error) {
    console.error('closeTableSession error:', error);
    res.status(500).json({ error: 'Failed to close table session' });
  }
}
