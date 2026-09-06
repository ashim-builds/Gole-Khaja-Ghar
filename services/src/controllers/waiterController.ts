import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { sendPushToAdmin } from '../integrations/webpush.js';

export async function listWaiters(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.query;
    const where: any = {
      role: role ? (String(role).toUpperCase() as any) : { in: ['WAITER', 'KITCHEN'] },
    };

    const staffList = await prisma.user.findMany({
      where,
      include: {
        staffProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = staffList.map((w) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      role: w.role.toLowerCase(),
      employeeCode: w.staffProfile?.employeeCode || '',
      isActive: w.staffProfile?.isActive ?? true,
      notes: w.staffProfile?.notes || '',
      createdAt: w.createdAt,
    }));

    res.json({ success: true, waiters: formatted, staff: formatted });
  } catch (error) {
    console.error('List staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
}

export async function createWaiter(req: Request, res: Response): Promise<void> {
  try {
    const { name, phone, email, password, employeeCode, notes, role = 'WAITER' } = req.body;

    if (!name || !phone || !password || !employeeCode) {
      res.status(400).json({ error: 'Name, phone, employee code, and password are required' });
      return;
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedCode = employeeCode.trim().toUpperCase();
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    const staffRole = role && String(role).toUpperCase() === 'KITCHEN' ? 'KITCHEN' : 'WAITER';

    // 1. Name validation (letters & spaces only, no numbers)
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName) || trimmedName.length < 2) {
      res.status(400).json({ error: 'Full name must contain only letters (numbers are not allowed)' });
      return;
    }

    // 2. Phone validation (exact 10 digits starting with 9)
    if (!/^9\d{9}$/.test(trimmedPhone)) {
      res.status(400).json({ error: 'Phone number must be exactly 10 digits starting with 9 (e.g. 98XXXXXXXX)' });
      return;
    }

    // 3. Email validation if provided
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address (e.g. user@gmail.com)' });
      return;
    }

    // 4. Employee code validation
    if (!/^[A-Z0-9_-]{2,20}$/.test(trimmedCode)) {
      res.status(400).json({ error: 'Employee code must be 2-20 characters (e.g. W-101, CHEF-1)' });
      return;
    }

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
      res.status(400).json({ error: 'A staff member with this employee code already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: trimmedPhone,
        email: cleanEmail,
        passwordHash,
        role: staffRole as any,
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
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        employeeCode: user.staffProfile?.employeeCode || '',
        isActive: user.staffProfile?.isActive ?? true,
        notes: user.staffProfile?.notes || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
}

export async function deleteWaiter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true },
    });

    if (!user || (user.role !== 'WAITER' && user.role !== 'KITCHEN')) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Staff account deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff account' });
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
