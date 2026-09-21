import webpush from 'web-push';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

const vapidEmail =
  process.env.VAPID_EMAIL || process.env.VAPID_SUBJECT || 'mailto:admin@golekhajaghar.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  orderNumber?: string;
  orderId?: string;
  tag?: string;
}

async function sendToSubscription(
  sub: { endpoint: string; p256dhKey: string; authKey: string },
  payload: PushPayload
) {
  try {
    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon-circle.png',
      badge: payload.badge || '/favicon-circle.png',
      image: payload.image,
      url: payload.url || (payload.orderNumber ? `/order/${payload.orderNumber}` : '/'),
      orderNumber: payload.orderNumber,
      orderId: payload.orderId,
      tag: payload.tag || (payload.orderNumber ? `gkg-${payload.orderNumber}` : `gkg-${Date.now()}`),
      timestamp: Date.now(),
    });

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
      },
      pushData,
      {
        urgency: 'high',
        TTL: 60 * 60 * 24, // 24 hours
      }
    );
  } catch (err: any) {
    console.error(`[WebPush] Send notification error (${sub.endpoint.slice(0, 30)}...):`, err?.message || err);
    if (err.statusCode === 410 || err.statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
    }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY || !userId) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToAdmin(payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await prisma.pushSubscription.findMany({ where: { clientType: 'ADMIN' } });
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToAllCustomers(payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await prisma.pushSubscription.findMany({ where: { clientType: 'CUSTOMER' } });
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}
