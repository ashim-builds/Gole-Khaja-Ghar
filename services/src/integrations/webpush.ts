import webpush from 'web-push';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

async function sendToSubscription(
  sub: { endpoint: string; p256dhKey: string; authKey: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
      },
      JSON.stringify({ ...payload, icon: payload.icon ?? '/favicon-circle.png' })
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
    }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
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
