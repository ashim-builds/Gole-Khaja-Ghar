"use client";

import { useEffect, useState } from "react";
import { Bell, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { subscribeToPush, checkPushSubscription } from "@/lib/pushManager";

interface Props {
  userId?: string;
  forceShow?: boolean;
}

export default function PushNotificationSetup({ userId, forceShow = false }: Props) {
  const { user } = useUser();
  const isStaff = ["WAITER", "CASHIER", "ADMIN", "SUPER_ADMIN"].includes(
    (user?.role || "").toUpperCase()
  );
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      // Allow session dismiss instead of permanent blocking
      return sessionStorage.getItem("gkg_push_dismissed_session") === "true";
    } catch {
      return false;
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    checkPushSubscription().then((status) => {
      setSubscribed(status.isSubscribed);
      setPermission(status.permission);
    });
  }, []);

  if (!mounted) {
    return null;
  }

  // Don't show if notifications not supported, already subscribed (unless forced), or permission explicitly denied
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    (!forceShow && (subscribed || permission === "denied" || dismissed))
  ) {
    return null;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const activeUserId = userId || user?.id?.toString() || undefined;
      await subscribeToPush(isStaff ? "admin" : "customer", activeUserId);
      setSubscribed(true);
      setSuccessMsg("Notifications enabled! You'll receive live alerts in your notification center.");
      setTimeout(() => {
        setDismissed(true);
      }, 3500);
    } catch (err: any) {
      console.error("[PushSetup] Subscribe error:", err);
      setError(err.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("gkg_push_dismissed_session", "true");
    } catch {}
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-88 z-[1000] bg-stone-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-stone-700/60 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/30">
        <Bell className="w-5 h-5 text-white animate-bounce" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm text-white">Enable Notification Center Alerts</p>
        <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
          Get real-time cooking, ready & delivery notifications sent straight to your device even when this tab is closed.
        </p>

        {error && (
          <p className="text-[11px] text-red-300 font-semibold mt-2 bg-red-950/60 p-2 rounded-lg border border-red-800/40 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
            {error}
          </p>
        )}

        {successMsg && (
          <p className="text-[11px] text-emerald-300 font-semibold mt-2 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            {successMsg}
          </p>
        )}

        {!successMsg && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              id="push-enable-btn"
              className="flex-1 py-2 px-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-primary/25 text-center"
            >
              {loading ? "Activating Alerts…" : "🔔 Turn On Notifications"}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-2.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5"
            >
              Later
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-stone-400 hover:text-white transition-colors cursor-pointer p-1"
        aria-label="Close notification prompt"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
