"use client";

import { useEffect } from "react";
import { subscribeToPush } from "@/lib/pushManager";

/**
 * Silently syncs admin device push notifications when permission is granted.
 * No intrusive popups on load — syncs automatically if the admin already granted permission.
 */
export default function AdminPushSetup() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) return;

    if (Notification.permission === "granted") {
      subscribeToPush("admin").catch((err) => {
        console.warn("[AdminPushSetup] Auto-sync warning:", err);
      });
    }
  }, []);

  return null;
}

