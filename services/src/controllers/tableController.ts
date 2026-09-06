import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

export async function listTables(_req: Request, res: Response): Promise<void> {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          include: {
            waiter: { select: { id: true, name: true } },
            orders: {
              include: {
                items: true,
              },
            },
            bill: {
              include: {
                payments: true,
              },
            },
          },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    const formatted = tables.map((table) => {
      const activeSession = table.sessions[0] || null;
      let totalAmount = 0;
      let itemCount = 0;

      if (activeSession) {
        activeSession.orders.forEach((order) => {
          totalAmount += Number(order.totalAmount);
          itemCount += order.items.reduce((sum, it) => sum + it.quantity, 0);
        });
      }

      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: activeSession ? 'OCCUPIED' : table.status,
        qrCodeToken: table.qrCodeToken,
        activeSession: activeSession
          ? {
              id: activeSession.id,
              waiterName: activeSession.waiter?.name || 'Staff',
              guestCount: activeSession.guestCount,
              openedAt: activeSession.openedAt,
              totalAmount,
              itemCount,
              ordersCount: activeSession.orders.length,
              billStatus: activeSession.bill?.status || 'UNPAID',
            }
          : null,
      };
    });

    res.json({ success: true, tables: formatted });
  } catch (error) {
    console.error('listTables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
}

export async function createTable(req: Request, res: Response): Promise<void> {
  try {
    const { tableNumber, capacity } = req.body;
    if (!tableNumber) {
      res.status(400).json({ error: 'Table number is required (e.g. T-1, T-2)' });
      return;
    }

    const trimmedNumber = tableNumber.trim().toUpperCase();
    const existing = await prisma.restaurantTable.findUnique({
      where: { tableNumber: trimmedNumber },
    });

    if (existing) {
      res.status(400).json({ error: `Table ${trimmedNumber} already exists` });
      return;
    }

    const qrCodeToken = crypto.randomBytes(16).toString('hex');

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: trimmedNumber,
        capacity: parseInt(capacity as string, 10) || 4,
        qrCodeToken,
        status: 'AVAILABLE',
      },
    });

    res.status(201).json({ success: true, table });
  } catch (error) {
    console.error('createTable error:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
}

export async function updateTable(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, status, isActive } = req.body;

    const data: any = {};
    if (tableNumber) data.tableNumber = tableNumber.trim().toUpperCase();
    if (capacity) data.capacity = parseInt(capacity as string, 10);
    if (status) data.status = status;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const table = await prisma.restaurantTable.update({
      where: { id },
      data,
    });

    res.json({ success: true, table });
  } catch (error) {
    console.error('updateTable error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
}

export async function deleteTable(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId: id, status: 'ACTIVE' },
    });

    if (activeSession) {
      res.status(400).json({ error: 'Cannot delete table with an active dining session' });
      return;
    }

    await prisma.restaurantTable.delete({ where: { id } });
    res.json({ success: true, message: 'Table removed successfully' });
  } catch (error) {
    console.error('deleteTable error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
}

export async function openTableSession(req: Request, res: Response): Promise<void> {
  try {
    const { tableId, waiterId, guestCount, notes } = req.body;

    if (!tableId) {
      res.status(400).json({ error: 'Table ID is required' });
      return;
    }

    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    const existingActive = await prisma.tableSession.findFirst({
      where: { tableId, status: 'ACTIVE' },
    });

    if (existingActive) {
      res.status(400).json({ error: `Table ${table.tableNumber} already has an active dining session` });
      return;
    }

    const [session] = await prisma.$transaction([
      prisma.tableSession.create({
        data: {
          tableId,
          waiterId: waiterId || null,
          guestCount: parseInt(guestCount as string, 10) || 1,
          status: 'ACTIVE',
          notes: notes?.trim() || null,
        },
        include: {
          table: true,
          waiter: { select: { id: true, name: true } },
        },
      }),
      prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      }),
    ]);

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error('openTableSession error:', error);
    res.status(500).json({ error: 'Failed to open table session' });
  }
}
