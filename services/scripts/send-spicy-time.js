const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const webpush = require("web-push");

// 1. Load env variables manually from .env
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const match = line.trim().match(/^([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI not found in environment.");
  process.exit(1);
}

// 2. Initialize VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@crispychips.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 3. Define schema to fetch subscriptions
const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  type: { type: String, required: true, enum: ["customer", "admin"] },
  userId: { type: String }
});

const PushSubscription = mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");

    // Fetch customer subscriptions
    const subs = await PushSubscription.find({ type: "customer" }).lean();
    console.log(`Found ${subs.length} customer subscriptions.`);

    if (subs.length === 0) {
      console.log("No subscriptions to alert.");
      mongoose.disconnect();
      return;
    }

    const payload = JSON.stringify({
      title: "🍟 Spicy Time!",
      body: "It's 2 o'clock — time for some hot, crispy snacks! Order your favorites now. 😋",
      icon: "/favicon-circle.png",
      url: "/shop"
    });

    console.log("Broadcasting push notifications...");
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
            },
            payload
          );
        } catch (err) {
          // If subscription has expired (410 Gone / 404), clear it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          }
          throw err;
        }
      })
    );

    const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;
    const rejectedCount = results.filter((r) => r.status === "rejected").length;
    console.log(`Finished. Success: ${fulfilledCount}, Failed/Cleaned: ${rejectedCount}`);
  } catch (error) {
    console.error("Spicy time cron job failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected database.");
  }
}

run();
