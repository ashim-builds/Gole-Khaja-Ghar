/**
 * Gole Khaja Ghar - Hotel & Meal Time Push Notification CLI Runner
 *
 * Usage:
 *   node send-hotel-push.js morning
 *   node send-hotel-push.js afternoon
 *   node send-hotel-push.js khajatime
 *   node send-hotel-push.js nightparty
 *   node send-hotel-push.js nightclose
 *   node send-hotel-push.js chefspecial
 *   node send-hotel-push.js weekend
 *   node send-hotel-push.js rainy
 *   node send-hotel-push.js flash
 *   node send-hotel-push.js room
 *   node send-hotel-push.js booking
 *   node send-hotel-push.js custom --title "Special Alert" --body "Message text" --url "/shop"
 *   node send-hotel-push.js list
 *   Add --dry-run to test without broadcasting
 */

const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const TEMPLATES = {
  morning: {
    id: 'morning_breakfast',
    title: '🌅 Good Morning from Gole Khaja Ghar!',
    body: 'Start your morning with steaming Masala Tea, hot Parathas, Jerry Swari, Samosas & Fresh Bakery. Hot breakfast is ready for you! ☕🍳',
    icon: '/favicon-circle.png',
    url: '/shop?category=breakfast',
  },
  afternoon: {
    id: 'afternoon_lunch',
    title: '🍛 Lunch Hour Special is Live!',
    body: 'Hungry for lunch? Enjoy authentic Nepali Khana Set, Chicken Fried Rice, Chowmein & freshly grilled Sekuwa. Order now for fast table service or delivery! 🍽️',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  khajatime: {
    id: 'khaja_time',
    title: '🥟 Khaja Time is Here! (4:00 PM)',
    body: 'Craving spicy C-MoMo, crunchy Khaja Sets, Sukuti & fresh Sekuwa? Gather your friends or order to your doorstep now! 😋🔥',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  nightparty: {
    id: 'night_party',
    title: '🎉 Night Party & Evening Vibes!',
    body: 'The charcoal grill is smoking! Crispy Chhoila, sizzling Sekuwa platters, chilled drinks and great music await you at Gole Khaja Ghar tonight. 🍗🍻✨',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  nightclose: {
    id: 'night_shop_close',
    title: '🌙 Shop Closing for Tonight (9:00 PM)',
    body: 'Gole Khaja Ghar is now closing orders for tonight! Thank you for dining with us today. Have a peaceful night and see you fresh tomorrow morning at 8:00 AM! 😴✨',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  chefspecial: {
    id: 'chef_special',
    title: "👨‍🍳 Today's Chef Special Recommendation!",
    body: 'Our chef has prepared an exclusive Special Dish today made with fresh local herbs & authentic spices. Check out today\'s menu!',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  weekend: {
    id: 'weekend_special',
    title: '🥂 Weekend Celebration at Gole Khaja Ghar!',
    body: 'Unwind your weekend with family & friends! Enjoy special discounts on giant Khaja Platters, Sekuwa and tasty snacks.',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  rainy: {
    id: 'rainy_day_comfort',
    title: '🌧️ Chilly Day? Warm Up With Hot Soupy Khaja!',
    body: 'Rainy vibes call for piping hot Jhol MoMo, spicy Thukpa & hot Masala Tea. Stay warm and let us deliver right to your door! 🥣🥟',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  flash: {
    id: 'flash_discount',
    title: '🏷️ Flash Offer: Special Discounts Today!',
    body: 'Special discount alert! Enjoy limited-time exclusive prices on selected snacks, drinks & khaja combos. Order while offers last! ⚡',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  room: {
    id: 'hotel_room_service',
    title: '🏨 Hotel Guests & In-Room Dining',
    body: 'Relax in comfort! Room dining service is active. Order delicious dishes directly from your phone for direct table & room delivery.',
    icon: '/favicon-circle.png',
    url: '/shop',
  },
  booking: {
    id: 'party_reservation',
    title: '🎂 Celebrate Your Birthday & Events With Us!',
    body: 'Planning a party, family gathering or birthday? Book your reserved tables & special party combo menus today at Gole Khaja Ghar!',
    icon: '/favicon-circle.png',
    url: '/contact',
  },
};

// Aliases
TEMPLATES.breakfast = TEMPLATES.morning;
TEMPLATES.lunch = TEMPLATES.afternoon;
TEMPLATES.khaja = TEMPLATES.khajatime;
TEMPLATES.party = TEMPLATES.nightparty;
TEMPLATES.close = TEMPLATES.nightclose;
TEMPLATES.closing = TEMPLATES.nightclose;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: args[0]?.toLowerCase() || 'list',
    dryRun: args.includes('--dry-run'),
    title: '',
    body: '',
    url: '/shop',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) options.title = args[i + 1];
    if (args[i] === '--body' && args[i + 1]) options.body = args[i + 1];
    if (args[i] === '--url' && args[i + 1]) options.url = args[i + 1];
  }

  return options;
}

async function run() {
  const options = parseArgs();

  if (options.command === 'list' || options.command === '--help' || options.command === '-h') {
    console.log('Available Notification Presets:');
    console.log('=============================');
    for (const [key, t] of Object.entries(TEMPLATES)) {
      if (['breakfast', 'lunch', 'khaja', 'party', 'close', 'closing'].includes(key)) continue;
      console.log(`- ${key.padEnd(14)} : ${t.title}`);
    }
    console.log('\nUsage Examples:');
    console.log('  node send-hotel-push.js morning');
    console.log('  node send-hotel-push.js afternoon');
    console.log('  node send-hotel-push.js khajatime');
    console.log('  node send-hotel-push.js nightparty');
    console.log('  node send-hotel-push.js nightclose');
    console.log('  node send-hotel-push.js chefspecial');
    console.log('  node send-hotel-push.js custom --title "Hello" --body "Special offer"');
    console.log('  node send-hotel-push.js khajatime --dry-run');
    return;
  }

  let selected = TEMPLATES[options.command];
  if (options.command === 'custom') {
    if (!options.title || !options.body) {
      console.error('Error: Custom broadcast requires --title and --body flags.');
      process.exit(1);
    }
    selected = {
      id: 'custom_cli',
      title: options.title,
      body: options.body,
      icon: '/favicon-circle.png',
      url: options.url || '/shop',
    };
  }

  if (!selected) {
    console.error(`Unknown preset: "${options.command}". Run "node send-hotel-push.js list" to see options.`);
    process.exit(1);
  }

  console.log(`[Push Runner] Selected preset: "${options.command}"`);
  console.log(`  Title: ${selected.title}`);
  console.log(`  Body:  ${selected.body}`);
  console.log(`  URL:   ${selected.url}`);

  if (options.dryRun) {
    console.log('\n[DRY RUN] No actual notifications were sent.');
    return;
  }

  // Check VAPID
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured in environment (.env).');
    process.exit(1);
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@golekhajaghar.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  try {
    await prisma.$connect();
    const subs = await prisma.pushSubscription.findMany({
      where: { clientType: 'CUSTOMER' },
    });

    console.log(`Found ${subs.length} active customer subscription(s).`);

    const payload = JSON.stringify({
      title: selected.title,
      body: selected.body,
      icon: selected.icon || '/favicon-circle.png',
      url: selected.url || '/shop',
      tag: `gkg-${selected.id}-${Date.now()}`,
    });

    console.log('Sending push notifications...');
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
          if (err && (err.statusCode === 410 || err.statusCode === 404)) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
          throw err;
        }
      })
    );

    // Also persist in notifications database
    try {
      await prisma.notification.create({
        data: {
          recipientType: 'ROLE_BROADCAST',
          type: 'SYSTEM_ALERT',
          title: selected.title,
          body: selected.body,
          linkUrl: selected.url,
          metadata: {
            templateId: selected.id,
            broadcast: true,
            source: 'cli',
          },
        },
      });
      console.log('Saved to in-app notification center database.');
    } catch (dbErr) {
      console.warn('Could not persist to database:', dbErr.message);
    }

    const delivered = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`Finished. Delivered: ${delivered}, Failed/Cleaned: ${failed}`);
  } catch (error) {
    console.error('Broadcast failed:', error);
  } finally {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  }
}

run();
