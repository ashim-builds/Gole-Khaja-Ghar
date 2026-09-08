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

    // Auto-subscribe admin/staff device to real-time push alerts
    async function setup() {
      try {
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

        let publicKey =
          (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
          (process.env as any)?.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!publicKey) {
          try {
            const res = await fetch("/api/push/vapid-public-key").then((r) => r.json());
            if (res.publicKey) publicKey = res.publicKey;
          } catch {}
        }

        if (!publicKey) return;

        // Check existing subscription
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

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

    const t = setTimeout(setup, 1500);
    return () => clearTimeout(t);
  }, []);

  return null; // No UI
}
