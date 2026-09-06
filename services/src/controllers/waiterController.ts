import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { sendPushToAdmin } from '../integrations/webpush.js';

export async function listWaiters(_req: Request, res: Response): Promise<void> {
  try {
    const waiters = await prisma.user.findMany({
      where: { role: 'WAITER' },
      include: {
        staffProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = waiters.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      employeeCode: w.staffProfile?.employeeCode || '',
      isActive: w.staffProfile?.isActive ?? true,
      notes: w.staffProfile?.notes || '',
      createdAt: w.createdAt,
    }));

    res.json({ success: true, waiters: formatted });
  } catch (error) {
    console.error('List waiters error:', error);
    res.status(500).json({ error: 'Failed to fetch waiters' });
  }
}

export async function createWaiter(req: Request, res: Response): Promise<void> {
  try {
    const { name, phone, email, password, employeeCode, notes } = req.body;

    if (!name || !phone || !password || !employeeCode) {
      res.status(400).json({ error: 'Name, phone, employee code, and password are required' });
      return;
    }

    const trimmedPhone = phone.trim();
    const trimmedCode = employeeCode.trim().toUpperCase();
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    // Check existing phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
    });
    if (existingPhone) {
      res.status(400).json({ error: 'A user with this phone number already exists' });
      return;
    }

    // Check existing email if provided
    if (cleanEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        res.status(400).json({ error: 'A user with this email already exists' });
        return;
      }
    }

    // Check employee code
    const existingCode = await prisma.staffProfile.findUnique({
      where: { employeeCode: trimmedCode },
    });
    if (existingCode) {
      res.status(400).json({ error: 'A waiter with this employee code already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const waiter = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: trimmedPhone,
        email: cleanEmail,
        passwordHash,
        role: 'WAITER',
        authProvider: 'LOCAL',
        staffProfile: {
          create: {
            employeeCode: trimmedCode,
            isActive: true,
            notes: notes?.trim() || null,
          },
        },
      },
      include: {
        staffProfile: true,
      },
    });

    res.status(201).json({
      success: true,
      waiter: {
        id: waiter.id,
        name: waiter.name,
        email: waiter.email,
        phone: waiter.phone,
        employeeCode: waiter.staffProfile?.employeeCode || '',
        isActive: waiter.staffProfile?.isActive ?? true,
        notes: waiter.staffProfile?.notes || '',
        createdAt: waiter.createdAt,
      },
    });
  } catch (error) {
    console.error('Create waiter error:', error);
    res.status(500).json({ error: 'Failed to create waiter account' });
  }
}

export async function deleteWaiter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true },
    });

    if (!user || user.role !== 'WAITER') {
      res.status(404).json({ error: 'Waiter not found' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Waiter account deleted successfully' });
  } catch (error) {
    console.error('Delete waiter error:', error);
    res.status(500).json({ error: 'Failed to delete waiter account' });
  }
}

export async function testAdminPush(_req: Request, res: Response): Promise<void> {
  try {
    await sendPushToAdmin({
      title: '🔔 Test Notification',
      body: 'Push notifications are working perfectly for Gole Khaja Ghar Admin!',
      url: '/admin',
    });

    res.json({ success: true, message: 'Test notification triggered' });
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ error: 'Failed to send test push' });
  }
}
