const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Initialize VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@golekhajaghar.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.error('VAPID keys not configured in environment.');
  process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to MySQL Database...');
    await prisma.$connect();
    console.log('Connected to MySQL successfully.');

    // Fetch customer subscriptions from MySQL
    const subs = await prisma.pushSubscription.findMany({
      where: { clientType: 'CUSTOMER' },
    });

    console.log(`Found ${subs.length} customer subscription(s) in MySQL.`);

    if (subs.length === 0) {
      console.log('No subscriptions found to notify.');
      await prisma.$disconnect();
      return;
    }

    const payload = JSON.stringify({
      title: '🥟 Khaja Time!',
      body: "It's time for delicious Khaja! Order your favorite Sekuwa, Chowmein, MoMo & Khaja Sets from Gole Khaja Ghar now. 😋",
      icon: '/favicon-circle.png',
      url: '/shop',
    });

    console.log('Broadcasting push notifications to customers...');
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
            },
            payload
          );
        } catch (err) {
          // If subscription has expired (410 Gone / 404), clean it from MySQL
          if (err && (err.statusCode === 410 || err.statusCode === 404)) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
          throw err;
        }
      })
    );

    const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;
    console.log(`Finished. Delivered: ${fulfilledCount}, Failed/Cleaned: ${rejectedCount}`);
  } catch (error) {
    console.error('Khaja time push broadcast failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected.');
  }
}

run();
