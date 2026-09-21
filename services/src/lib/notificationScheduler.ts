import prisma from './prisma.js';
import { sendPushToAllCustomers, sendPushToAdmin, PushPayload } from '../integrations/webpush.js';
import { emitNotification } from './socket.js';
import { NOTIFICATION_TEMPLATES, NotificationTemplate } from './notificationTemplates.js';

export interface ScheduleSlot {
  id: string;
  name: string;
  emoji: string;
  timeNPT: string; // "08:30", "12:30", "16:00", "19:30", "21:00"
  enabled: boolean;
  templateId: string;
}

export interface BroadcastResult {
  success: boolean;
  recipientsCount: number;
  deliveredCount: number;
  failedCount: number;
  templateId?: string;
  title: string;
  body: string;
  url: string;
  timestamp: string;
}

// In-memory state for scheduler
class NotificationSchedulerManager {
  private timer: NodeJS.Timeout | null = null;
  private isAutoEnabled: boolean = true;
  private sentHistory: Map<string, Date> = new Map(); // key: "YYYY-MM-DD:slotId" -> Date
  private recentBroadcasts: BroadcastResult[] = [];

  private slots: ScheduleSlot[] = [
    {
      id: 'morning_breakfast',
      name: 'Morning Breakfast & Fresh Tea',
      emoji: '🌅',
      timeNPT: '08:30',
      enabled: true,
      templateId: 'morning_breakfast',
    },
    {
      id: 'afternoon_lunch',
      name: 'Afternoon Lunch & Specials',
      emoji: '🍛',
      timeNPT: '12:30',
      enabled: true,
      templateId: 'afternoon_lunch',
    },
    {
      id: 'khaja_time',
      name: 'Khaja Time (4 PM Snacks & MoMo)',
      emoji: '🥟',
      timeNPT: '16:00',
      enabled: true,
      templateId: 'khaja_time',
    },
    {
      id: 'night_party',
      name: 'Night Party & Evening Hangout',
      emoji: '🎉',
      timeNPT: '19:30',
      enabled: true,
      templateId: 'night_party',
    },
    {
      id: 'night_shop_close',
      name: 'Night 9:00 PM Shop Closing Alert',
      emoji: '🌙',
      timeNPT: '21:00',
      enabled: true,
      templateId: 'night_shop_close',
    },
  ];

  /**
   * Helper to get Current Nepal Time (UTC+5:45)
   */
  public getNepalDateTime(): Date {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const nepalOffsetMs = (5 * 60 + 45) * 60000;
    return new Date(utcTime + nepalOffsetMs);
  }

  public getNepalTimeString(): { timeStr: string; dateStr: string; fullFormatted: string } {
    const nepalDate = this.getNepalDateTime();
    const hours = String(nepalDate.getHours()).padStart(2, '0');
    const minutes = String(nepalDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const year = nepalDate.getFullYear();
    const month = String(nepalDate.getMonth() + 1).padStart(2, '0');
    const day = String(nepalDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const fullFormatted = nepalDate.toLocaleString('en-US', {
      timeZone: 'Asia/Kathmandu',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return { timeStr, dateStr, fullFormatted };
  }

  /**
   * Start background evaluation loop (runs every 30 seconds)
   */
  public start() {
    if (this.timer) return;
    console.log('[NotificationScheduler] Nepal Time Auto-Push Engine started.');
    // Run initial check after 5 seconds
    setTimeout(() => this.tick(), 5000);
    this.timer = setInterval(() => this.tick(), 30000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[NotificationScheduler] Auto-Push Engine stopped.');
    }
  }

  public isEnabled(): boolean {
    return this.isAutoEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isAutoEnabled = enabled;
  }

  public getSlots(): ScheduleSlot[] {
    return this.slots;
  }

  public updateSlot(slotId: string, updates: Partial<ScheduleSlot>): ScheduleSlot | null {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return null;
    if (typeof updates.enabled === 'boolean') slot.enabled = updates.enabled;
    if (updates.timeNPT) slot.timeNPT = updates.timeNPT;
    if (updates.templateId) slot.templateId = updates.templateId;
    return slot;
  }

  public getStatus() {
    const { timeStr, dateStr, fullFormatted } = this.getNepalTimeString();

    // Determine upcoming next slot today or tomorrow
    const sortedSlots = [...this.slots].sort((a, b) => a.timeNPT.localeCompare(b.timeNPT));
    let nextSlot = sortedSlots.find((s) => s.enabled && s.timeNPT > timeStr);
    let isTomorrow = false;
    if (!nextSlot) {
      nextSlot = sortedSlots.find((s) => s.enabled);
      isTomorrow = true;
    }

    const slotStatus = this.slots.map((s) => {
      const historyKey = `${dateStr}:${s.id}`;
      const sentAt = this.sentHistory.get(historyKey) || null;
      return {
        ...s,
        sentToday: Boolean(sentAt),
        sentAt: sentAt ? sentAt.toISOString() : null,
      };
    });

    return {
      autoEnabled: this.isAutoEnabled,
      nepalCurrentTime: timeStr,
      nepalCurrentDate: dateStr,
      nepalFullFormatted: fullFormatted,
      nextScheduledSlot: nextSlot
        ? {
            ...nextSlot,
            targetDay: isTomorrow ? 'Tomorrow' : 'Today',
          }
        : null,
      slots: slotStatus,
      recentBroadcasts: this.recentBroadcasts.slice(0, 10),
    };
  }

  /**
   * Broadcast notification to all customers or admin
   */
  public async broadcast(params: {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    templateId?: string;
    category?: string;
    targetRole?: 'CUSTOMER' | 'ADMIN';
    saveToDb?: boolean;
  }): Promise<BroadcastResult> {
    const {
      title,
      body,
      url = '/shop',
      icon = '/favicon-circle.png',
      badge = '/favicon-circle.png',
      templateId,
      category = 'BROADCAST',
      targetRole = 'CUSTOMER',
      saveToDb = true,
    } = params;

    const payload: PushPayload = {
      title,
      body,
      url,
      icon,
      badge,
      tag: `gkg-${templateId || 'alert'}-${Date.now()}`,
    };

    let deliveredCount = 0;
    let failedCount = 0;
    let totalSubs = 0;

    try {
      // 1. Send native web push to subscribed devices
      if (targetRole === 'ADMIN') {
        const subs = await prisma.pushSubscription.findMany({ where: { clientType: 'ADMIN' } });
        totalSubs = subs.length;
        await sendPushToAdmin(payload);
      } else {
        const subs = await prisma.pushSubscription.findMany({ where: { clientType: 'CUSTOMER' } });
        totalSubs = subs.length;
        await sendPushToAllCustomers(payload);
      }
      deliveredCount = totalSubs; // Promise.allSettled handled inside webpush
    } catch (pushErr) {
      console.error('[NotificationScheduler] WebPush send error:', pushErr);
      failedCount = 1;
    }

    // 2. Persist in database Notification center so users see it in Bell dropdown
    let savedNotifId: string | undefined;
    if (saveToDb) {
      try {
        const created = await prisma.notification.create({
          data: {
            targetRole: targetRole === 'ADMIN' ? 'ADMIN' : null,
            recipientType: 'ROLE_BROADCAST',
            type: 'SYSTEM_ALERT',
            title,
            body,
            linkUrl: url,
            metadata: {
              templateId,
              category,
              broadcast: true,
              icon,
            },
          },
        });
        savedNotifId = created.id;
      } catch (dbErr) {
        console.error('[NotificationScheduler] Database notification save error:', dbErr);
      }
    }

    // 3. Emit live WebSocket notification event for active users/admins
    try {
      emitNotification({
        id: savedNotifId || `broadcast-${Date.now()}`,
        targetRole: targetRole === 'ADMIN' ? 'ADMIN' : null,
        recipientType: 'ROLE_BROADCAST',
        type: 'SYSTEM_ALERT',
        title,
        body,
        linkUrl: url,
        createdAt: new Date().toISOString(),
      });
    } catch (socketErr) {
      console.error('[NotificationScheduler] Socket emit error:', socketErr);
    }

    const result: BroadcastResult = {
      success: true,
      recipientsCount: totalSubs,
      deliveredCount,
      failedCount,
      templateId,
      title,
      body,
      url,
      timestamp: new Date().toISOString(),
    };

    // Store in recent broadcasts memory
    this.recentBroadcasts.unshift(result);
    if (this.recentBroadcasts.length > 30) {
      this.recentBroadcasts.pop();
    }

    return result;
  }

  /**
   * Evaluation tick run every 30 seconds
   */
  private async tick() {
    if (!this.isAutoEnabled) return;

    const { timeStr, dateStr } = this.getNepalTimeString();

    for (const slot of this.slots) {
      if (!slot.enabled) continue;

      // Check if time matches current HH:mm
      if (slot.timeNPT === timeStr) {
        const historyKey = `${dateStr}:${slot.id}`;
        if (this.sentHistory.has(historyKey)) {
          // Already sent today
          continue;
        }

        // Mark as sent immediately to avoid race condition during async execution
        this.sentHistory.set(historyKey, new Date());

        // Get template
        const template: NotificationTemplate | undefined =
          NOTIFICATION_TEMPLATES[slot.templateId] || NOTIFICATION_TEMPLATES[slot.id];

        if (template) {
          console.log(
            `[NotificationScheduler] 🚀 Auto-triggering slot '${slot.name}' (${slot.timeNPT} NPT) to all customers!`
          );
          try {
            await this.broadcast({
              title: template.title,
              body: template.body,
              url: template.url,
              icon: template.icon,
              templateId: template.id,
              category: template.category,
              targetRole: 'CUSTOMER',
              saveToDb: true,
            });
            console.log(`[NotificationScheduler] ✅ Successfully broadcasted '${slot.name}'.`);
          } catch (err) {
            console.error(`[NotificationScheduler] ❌ Failed to broadcast '${slot.name}':`, err);
          }
        }
      }
    }

    // Clean up old history keys older than 3 days
    if (this.sentHistory.size > 100) {
      const today = dateStr;
      for (const [key] of this.sentHistory) {
        if (!key.startsWith(today)) {
          this.sentHistory.delete(key);
        }
      }
    }
  }
}

export const notificationScheduler = new NotificationSchedulerManager();
