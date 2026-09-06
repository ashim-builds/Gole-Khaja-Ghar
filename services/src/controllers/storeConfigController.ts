import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export type StoreOperationalMode = 'AUTO' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';

interface StoreConfigData {
  mode: StoreOperationalMode;
  customReason?: string;
  updatedAt: string;
  updatedBy?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'store_config.json');

function getStoredConfig(): StoreConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read store_config.json, using defaults:', err);
  }

  return {
    mode: 'AUTO',
    customReason: '',
    updatedAt: new Date().toISOString(),
  };
}

function saveStoredConfig(config: StoreConfigData): void {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store_config.json:', err);
  }
}

/**
 * Calculates current time in Nepal Timezone (Asia/Kathmandu, UTC +5:45)
 */
function getNepalDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepalOffsetMs = 5.75 * 3600000; // 5h 45m
  return new Date(utc + nepalOffsetMs);
}

export function evaluateStoreStatus() {
  const config = getStoredConfig();
  const nepalDate = getNepalDate();
  const dayOfWeek = nepalDate.getDay(); // 0 = Sun, 2 = Tue
  const dayOfMonth = nepalDate.getDate();
  const hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();

  const currentTimeInMinutes = hours * 60 + minutes;
  const openTimeInMinutes = 8 * 60; // 08:00 AM
  const closeTimeInMinutes = 21 * 60; // 09:00 PM

  const isFirstTuesday = dayOfWeek === 2 && dayOfMonth <= 7;
  const isOutsideHours = currentTimeInMinutes < openTimeInMinutes || currentTimeInMinutes >= closeTimeInMinutes;

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const nepalTimeFormatted = timeFormatter.format(nepalDate);

  // Manual Overrides
  if (config.mode === 'MANUAL_OPEN') {
    return {
      isOpen: true,
      mode: 'MANUAL_OPEN' as StoreOperationalMode,
      isFirstTuesday,
      isOutsideHours,
      statusText: 'Open (Admin Override)',
      badgeLabel: 'Open Now (Manual)',
      reason: config.customReason || 'Store is currently open by Admin override.',
      nextOpening: 'Currently active',
      nepalTimeFormatted,
      updatedAt: config.updatedAt,
    };
  }

  if (config.mode === 'MANUAL_CLOSED') {
    return {
      isOpen: false,
      mode: 'MANUAL_CLOSED' as StoreOperationalMode,
      isFirstTuesday,
      isOutsideHours,
      statusText: 'Closed by Admin',
      badgeLabel: 'Closed (Admin Control)',
      reason: config.customReason || 'Store is temporarily closed by management.',
      nextOpening: 'Pending management reopen',
      nepalTimeFormatted,
      updatedAt: config.updatedAt,
    };
  }

  // AUTO SCHEDULE MODE
  if (isFirstTuesday) {
    return {
      isOpen: false,
      mode: 'AUTO' as StoreOperationalMode,
      isFirstTuesday: true,
      isOutsideHours: false,
      statusText: 'Closed Today',
      badgeLabel: 'Closed Today (1st Tuesday)',
      reason: 'Closed today for our scheduled monthly maintenance (1st Tuesday of every month).',
      nextOpening: 'Tomorrow at 8:00 AM',
      nepalTimeFormatted,
      updatedAt: config.updatedAt,
    };
  }

  if (isOutsideHours) {
    const willOpenToday = currentTimeInMinutes < openTimeInMinutes;
    return {
      isOpen: false,
      mode: 'AUTO' as StoreOperationalMode,
      isFirstTuesday: false,
      isOutsideHours: true,
      statusText: 'Currently Closed',
      badgeLabel: 'Closed (Opens 8:00 AM)',
      reason: 'Our store is currently closed. Online ordering is available from 8:00 AM to 9:00 PM.',
      nextOpening: willOpenToday ? 'Today at 8:00 AM' : 'Tomorrow at 8:00 AM',
      nepalTimeFormatted,
      updatedAt: config.updatedAt,
    };
  }

  return {
    isOpen: true,
    mode: 'AUTO' as StoreOperationalMode,
    isFirstTuesday: false,
    isOutsideHours: false,
    statusText: 'Open Now',
    badgeLabel: 'Open (8:00 AM – 9:00 PM)',
    reason: 'We are currently open and accepting fresh dine-in, takeaway, and delivery orders!',
    nextOpening: 'Open until 9:00 PM tonight',
    nepalTimeFormatted,
    updatedAt: config.updatedAt,
  };
}

/**
 * GET /api/store-status or GET /api/admin/store-status
 */
export async function getStoreStatusHandler(_req: Request, res: Response): Promise<void> {
  try {
    const status = evaluateStoreStatus();
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to get store status' });
  }
}

/**
 * PATCH /api/admin/store-status
 */
export async function updateStoreStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { mode, customReason } = req.body;

    if (!['AUTO', 'MANUAL_OPEN', 'MANUAL_CLOSED'].includes(mode)) {
      res.status(400).json({ success: false, message: 'Invalid mode. Must be AUTO, MANUAL_OPEN, or MANUAL_CLOSED' });
      return;
    }

    const newConfig: StoreConfigData = {
      mode,
      customReason: customReason ? String(customReason).trim() : '',
      updatedAt: new Date().toISOString(),
      updatedBy: (req as any).user?.name || (req as any).user?.email || 'Admin',
    };

    saveStoredConfig(newConfig);

    const updatedStatus = evaluateStoreStatus();
    res.json({
      success: true,
      message: `Store status updated to ${mode}`,
      ...updatedStatus,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to update store status' });
  }
}
