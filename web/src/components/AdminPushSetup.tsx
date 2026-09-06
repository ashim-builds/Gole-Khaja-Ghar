"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Silently subscribes the admin browser to push notifications.
 * No UI — fires automatically when the admin layout mounts.
 * If the browser already has a subscription, it just updates the record.
 */
export default function AdminPushSetup() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) return;

    // Only run if permission already granted or default (first time, auto-request for admin)
    async function setup() {
      try {
        if (process.env.NODE_ENV === "development") return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Ensure service worker is registered and active
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.register("/sw.js");
        }
        if (!reg.active) {
          reg = await navigator.serviceWorker.ready;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const subJson = sub.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subJson, type: "admin" }),
        });
      } catch (err) {
        console.error("[AdminPush] Setup error:", err);
      }
    }

    // Slight delay to not block initial render
    const t = setTimeout(setup, 2000);
    return () => clearTimeout(t);
  }, []);

  return null; // No UI
}
