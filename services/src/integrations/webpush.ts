import webpush from 'web-push';
import PushSubscriptionModel from '../models/PushSubscription.js';
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
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      JSON.stringify({ ...payload, icon: payload.icon ?? '/favicon-circle.png' })
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
    }
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await PushSubscriptionModel.find({ userId }).lean();
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToAdmin(payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await PushSubscriptionModel.find({ type: 'admin' }).lean();
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}

export async function sendPushToAllCustomers(payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await PushSubscriptionModel.find({ type: 'customer' }).lean();
  await Promise.allSettled(subs.map((s) => sendToSubscription(s, payload)));
}
