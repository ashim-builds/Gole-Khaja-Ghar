"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X, AlertCircle } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

interface Props {
  userId?: string;
}

export default function PushNotificationSetup({ userId }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("golu_push_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker?.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscribed(true);
          try {
            localStorage.setItem("golu_push_dismissed", "true");
          } catch {}
        }
      });
    });
  }, []);

  // Return null during server-side rendering (SSR) or before mounting
  if (!mounted) {
    return null;
  }

  // Don't show if: notifications not supported, already subscribed, or dismissed
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    subscribed ||
    permission === "denied" ||
    dismissed
  ) {
    return null;
  }

  const subscribe = async () => {
    setLoading(true);
    setError("");
    try {
      if (import.meta.env.DEV) {
        throw new Error(
          "PWA service worker not active. Note: Notifications are disabled in dev mode. Run 'npm run build && npm run preview' to test."
        );
      }

      // Get VAPID public key
      let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        try {
          const res = await fetch("/api/push/vapid-public-key").then((r) => r.json());
          if (res.publicKey) publicKey = res.publicKey;
        } catch {}
      }
      if (!publicKey) {
        throw new Error("VAPID public key is not configured.");
      }

      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        throw new Error("Notification permission denied by browser.");
      }

      // Get active service worker immediately if ready, or wait with a 15-second timeout
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !reg.active) {
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Service worker ready timeout. Please refresh and try again.")), 15000)
        );
        reg = (await Promise.race([readyPromise, timeoutPromise])) as ServiceWorkerRegistration;
      }

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Save to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subJson,
          type: "customer",
          userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register subscription with the server.");
      }

      setSubscribed(true);
      try {
        localStorage.setItem("golu_push_dismissed", "true");
      } catch {}
    } catch (err: any) {
      console.error("[Push] Subscribe error:", err);
      setError(err.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("golu_push_dismissed", "true");
    } catch {}
  };

  // Show a soft banner
  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[1000] bg-[#111111] text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white">Get order updates</p>
        <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
          Enable notifications to track your order status in real time.
        </p>
        {error && (
          <p className="text-[10px] text-red-400 font-semibold mt-1 bg-red-950/40 p-1.5 rounded-md border border-red-900/30 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
        <button
          onClick={subscribe}
          disabled={loading}
          id="push-enable-btn"
          className="mt-3 w-full py-2 bg-primary text-white text-xs font-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer shadow-md shadow-primary/20"
        >
          {loading ? "Enabling…" : "Enable Notifications"}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-stone-500 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
