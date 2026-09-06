import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { KotStatus, KotItemStatus, OrderStatus } from '@prisma/client';
import { sendPushToAdmin } from '../integrations/webpush.js';
import {
  emitKotStatusChanged,
  emitWaiterReadyAlert,
  emitOrderDelivered,
  emitTableUpdated,
  emitOrderStatusChanged,
} from '../lib/socket.js';

export async function getActiveKotTickets(_req: Request, res: Response): Promise<void> {
  try {
    const tickets = await prisma.kotTicket.findMany({
      where: {
        status: {
          in: [KotStatus.QUEUED, KotStatus.PREPARING, KotStatus.READY],
        },
      },
      include: {
        tableSession: {
          include: {
            table: true,
            waiter: {
              select: {
                id: true,
                name: true,
                staffProfile: { select: { employeeCode: true } },
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            customerName: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, tickets });
  } catch (error) {
    console.error('getActiveKotTickets error:', error);
    res.status(500).json({ error: 'Failed to fetch active KOT tickets' });
  }
}

export async function updateKotStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(KotStatus).includes(status)) {
      res.status(400).json({ error: 'Valid status is required (QUEUED, PREPARING, READY, SERVED, CANCELLED)' });
      return;
    }

    const ticket = await prisma.kotTicket.findUnique({
      where: { id },
      include: {
        tableSession: {
          include: {
            table: true,
            waiter: {
              select: {
                id: true,
                name: true,
                staffProfile: { select: { employeeCode: true } },
              },
            },
          },
        },
        order: true,
        items: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'KOT ticket not found' });
      return;
    }

    // Map KOT status to KOT item status & Order status
    let itemStatus: KotItemStatus = KotItemStatus.PENDING;
    let newOrderStatus: OrderStatus | null = null;

    if (status === KotStatus.PREPARING) {
      itemStatus = KotItemStatus.COOKING;
      newOrderStatus = OrderStatus.PREPARING;
    } else if (status === KotStatus.READY) {
      itemStatus = KotItemStatus.READY;
      newOrderStatus = OrderStatus.READY;
    } else if (status === KotStatus.SERVED) {
      itemStatus = KotItemStatus.SERVED;
      newOrderStatus = OrderStatus.DELIVERED;
    } else if (status === KotStatus.CANCELLED) {
      itemStatus = KotItemStatus.PENDING;
      newOrderStatus = OrderStatus.CANCELLED;
    }

    const txOps: any[] = [
      prisma.kotTicket.update({
        where: { id },
        data: { status },
        include: {
          tableSession: {
            include: {
              table: true,
              waiter: { select: { id: true, name: true } },
            },
          },
          order: true,
          items: true,
        },
      }),
      prisma.kotItem.updateMany({
        where: { kotTicketId: id },
        data: { status: itemStatus },
      }),
    ];

    if (newOrderStatus && ticket.orderId) {
      txOps.push(
        prisma.order.update({
          where: { id: ticket.orderId },
          data: { status: newOrderStatus },
        })
      );
    }
    if (newOrderStatus && ticket.tableSessionId) {
      txOps.push(
        prisma.order.updateMany({
          where: { tableSessionId: ticket.tableSessionId },
          data: { status: newOrderStatus },
        })
      );
    }

    const [updatedTicket] = await prisma.$transaction(txOps);

    const isOnline = !ticket.tableSessionId && ticket.order;
    const isDelivery = ticket.order?.orderType === 'DELIVERY';
    const isPickup = ticket.order?.orderType === 'PICKUP';

    let tableNumber = 'Takeaway';
    let channelLabel = 'Takeaway';
    if (ticket.tableSession?.table?.tableNumber) {
      tableNumber = ticket.tableSession.table.tableNumber;
      channelLabel = `Table ${ticket.tableSession.table.tableNumber}`;
    } else if (isOnline) {
      if (isDelivery) {
        tableNumber = `Online Delivery (${ticket.order?.orderNumber || 'Order'})`;
        channelLabel = `Online Delivery (#${ticket.order?.orderNumber || ''})`;
      } else if (isPickup) {
        tableNumber = `Online Pickup (${ticket.order?.orderNumber || 'Order'})`;
        channelLabel = `Online Pickup (#${ticket.order?.orderNumber || ''})`;
      } else {
        tableNumber = `Online Order (${ticket.order?.orderNumber || 'Order'})`;
        channelLabel = `Online Order (#${ticket.order?.orderNumber || ''})`;
      }
    }

    // Broadcast real-time status change to all connected clients (Kitchen, Waiters, Customers, Admin)
    emitKotStatusChanged({
      kotTicketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      status: updatedTicket.status,
      tableNumber,
      tableSessionId: updatedTicket.tableSessionId,
      orderId: updatedTicket.orderId || undefined,
      items: updatedTicket.items,
    });

    if (newOrderStatus) {
      emitOrderStatusChanged({
        orderId: updatedTicket.orderId || undefined,
        orderNumber: updatedTicket.order?.orderNumber,
        status: newOrderStatus,
      });
    }

    // If marked READY, specifically trigger waiter ready alert with sound & toast
    if (status === KotStatus.READY) {
      const itemsSummary = ticket.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ');

      emitWaiterReadyAlert({
        kotTicketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        tableNumber,
        tableSessionId: ticket.tableSessionId,
        waiterId: ticket.tableSession?.waiterId,
        waiterName: ticket.tableSession?.waiter?.name,
        itemsSummary,
      });

      await prisma.notification.create({
        data: {
          targetRole: 'WAITER',
          recipientType: 'ROLE_BROADCAST',
          type: 'KOT_READY',
          title: `${channelLabel}: KOT #${ticket.ticketNumber} is READY`,
          body: `Items ready for pickup: ${itemsSummary}`,
          linkUrl: '/pos',
          metadata: {
            kotTicketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            tableSessionId: ticket.tableSessionId,
            tableNumber,
          },
        },
      });

      sendPushToAdmin({
        title: `Food Ready - ${channelLabel}`,
        body: `KOT #${ticket.ticketNumber} is ready to be served!`,
        url: '/pos',
      }).catch((err) => console.error('Push error:', err));
    }

    res.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('updateKotStatus error:', error);
    res.status(500).json({ error: 'Failed to update KOT status' });
  }
}

export async function markKotDelivered(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const ticket = await prisma.kotTicket.findUnique({
      where: { id },
      include: {
        tableSession: {
          include: { table: true },
        },
        order: true,
        items: true,
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'KOT ticket not found' });
      return;
    }

    const txOps: any[] = [
      prisma.kotTicket.update({
        where: { id },
        data: { status: KotStatus.SERVED },
        include: {
          tableSession: {
            include: {
              table: true,
              waiter: {
                select: {
                  id: true,
                  name: true,
                  staffProfile: { select: { employeeCode: true } },
                },
              },
            },
          },
          order: true,
          items: true,
        },
      }),
      prisma.kotItem.updateMany({
        where: { kotTicketId: id },
        data: { status: KotItemStatus.SERVED },
      }),
    ];

    if (ticket.orderId) {
      txOps.push(
        prisma.order.update({
          where: { id: ticket.orderId },
          data: { status: OrderStatus.DELIVERED },
        })
      );
    }
    if (ticket.tableSessionId) {
      txOps.push(
        prisma.order.updateMany({
          where: { tableSessionId: ticket.tableSessionId },
          data: { status: OrderStatus.DELIVERED },
        })
      );
    }

    const [updatedTicket] = await prisma.$transaction(txOps);

    const isOnline = !ticket.tableSessionId && ticket.order;
    const isDelivery = ticket.order?.orderType === 'DELIVERY';
    const isPickup = ticket.order?.orderType === 'PICKUP';

    let tableNumber = 'Takeaway';
    if (ticket.tableSession?.table?.tableNumber) {
      tableNumber = ticket.tableSession.table.tableNumber;
    } else if (isOnline) {
      tableNumber = isDelivery
        ? `Online Delivery (${ticket.order?.orderNumber || 'Order'})`
        : isPickup
        ? `Online Pickup (${ticket.order?.orderNumber || 'Order'})`
        : `Online Order (${ticket.order?.orderNumber || 'Order'})`;
    }

    // Broadcast real-time delivery event
    emitOrderDelivered({
      kotTicketId: updatedTicket.id,
      tableNumber,
      orderId: updatedTicket.orderId || undefined,
      deliveredAt: new Date().toISOString(),
    });

    emitKotStatusChanged({
      kotTicketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      status: KotStatus.SERVED,
      tableNumber,
      tableSessionId: updatedTicket.tableSessionId,
      orderId: updatedTicket.orderId || undefined,
      items: updatedTicket.items,
    });

    emitOrderStatusChanged({
      orderId: updatedTicket.orderId || undefined,
      orderNumber: updatedTicket.order?.orderNumber,
      status: 'DELIVERED',
    });

    res.json({ success: true, message: `KOT #${ticket.ticketNumber} marked as delivered to ${tableNumber}`, ticket: updatedTicket });
  } catch (error) {
    console.error('markKotDelivered error:', error);
    res.status(500).json({ error: 'Failed to mark KOT as delivered' });
  }
}

export async function updateKotItemStatus(req: Request, res: Response): Promise<void> {
  try {
    const { itemId } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(KotItemStatus).includes(status)) {
      res.status(400).json({ error: 'Valid item status required (PENDING, COOKING, READY, SERVED)' });
      return;
    }

    const item = await prisma.kotItem.findUnique({
      where: { id: itemId },
      include: {
        kotTicket: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({ error: 'KOT Item not found' });
      return;
    }

    const updated = await prisma.kotItem.update({
      where: { id: itemId },
      data: { status },
    });

    // If item is now COOKING or READY and parent KOT is QUEUED, move KOT and Order to PREPARING
    if ((status === KotItemStatus.COOKING || status === KotItemStatus.READY) && item.kotTicket.status === KotStatus.QUEUED) {
      await prisma.kotTicket.update({
        where: { id: item.kotTicketId },
        data: { status: KotStatus.PREPARING },
      });

      if (item.kotTicket.orderId) {
        await prisma.order.update({
          where: { id: item.kotTicket.orderId },
          data: { status: OrderStatus.PREPARING },
        });

        emitOrderStatusChanged({
          orderId: item.kotTicket.orderId,
          orderNumber: item.kotTicket.order?.orderNumber,
          status: 'PREPARING',
        });
      }

      if (item.kotTicket.tableSessionId) {
        await prisma.order.updateMany({
          where: { tableSessionId: item.kotTicket.tableSessionId },
          data: { status: OrderStatus.PREPARING },
        });

        emitOrderStatusChanged({
          orderId: item.kotTicket.orderId || undefined,
          status: 'PREPARING',
        });
      }

      emitKotStatusChanged({
        kotTicketId: item.kotTicket.id,
        ticketNumber: item.kotTicket.ticketNumber,
        status: KotStatus.PREPARING,
        tableSessionId: item.kotTicket.tableSessionId,
        orderId: item.kotTicket.orderId || undefined,
      });
    }

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error('updateKotItemStatus error:', error);
    res.status(500).json({ error: 'Failed to update KOT item status' });
  }
}
