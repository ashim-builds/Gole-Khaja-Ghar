import React, { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Store,
  Sparkles,
} from "lucide-react";
import {
  checkPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushManager";
import { api } from "@/lib/api";

export default function AdminSettingsPage() {
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  }>({
    supported: true,
    permission: "default",
    isSubscribed: false,
  });

  const [loadingPush, setLoadingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Audio Alerts State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("gole_sound_alerts_enabled") !== "false";
  });

  const refreshPushStatus = async () => {
    const status = await checkPushSubscription();
    setPushStatus(status);
  };

  useEffect(() => {
    refreshPushStatus();
  }, []);

  const handleTogglePush = async () => {
    setLoadingPush(true);
    setPushFeedback(null);
    try {
      if (pushStatus.isSubscribed) {
        await unsubscribeFromPush();
        setPushFeedback({ type: "success", text: "Push notifications disallowed." });
      } else {
        await subscribeToPush("admin");
        setPushFeedback({ type: "success", text: "Push notifications allowed and enabled for Admin!" });
      }
      await refreshPushStatus();
    } catch (err: any) {
      console.error("Toggle push error:", err);
      setPushFeedback({
        type: "error",
        text: err.message || "Failed to update push notification settings.",
      });
    } finally {
      setLoadingPush(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    setPushFeedback(null);
    try {
      const res = await api.admin.testPush();
      if (res.success) {
        setPushFeedback({
          type: "success",
          text: "Test notification sent! Check your desktop/mobile notifications.",
        });
        if (soundEnabled) {
          playAlertSound();
        }
      }
    } catch (err: any) {
      setPushFeedback({
        type: "error",
        text: err.message || "Failed to send test notification.",
      });
    } finally {
      setTestingPush(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("gole_sound_alerts_enabled", next ? "true" : "false");
    if (next) {
      playAlertSound();
    }
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Could not play preview sound", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-black">Settings & Alerts</h1>
        <p className="text-stone-500 text-sm mt-1">
          Configure real-time push notifications, sound alerts, and restaurant preferences.
        </p>
      </div>

      {/* Feedback Toast */}
      {pushFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            pushFeedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {pushFeedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{pushFeedback.text}</span>
        </div>
      )}

      {/* Push Notifications Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              {pushStatus.isSubscribed ? (
                <Bell className="w-6 h-6 text-primary" />
              ) : (
                <BellOff className="w-6 h-6 text-stone-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-black">Push Notifications</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    pushStatus.isSubscribed
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : pushStatus.permission === "denied"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {pushStatus.isSubscribed
                    ? "Allowed & Active"
                    : pushStatus.permission === "denied"
                    ? "Blocked by Browser"
                    : "Disallowed"}
                </span>
              </div>
              <p className="text-sm text-stone-500 mt-1">
                Receive instant pop-up alerts on your device whenever a customer places an order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <button
              disabled={loadingPush}
              onClick={handleTogglePush}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                pushStatus.isSubscribed
                  ? "bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 border border-stone-200"
                  : "bg-orange-600 text-white hover:bg-orange-500 shadow-md shadow-orange-600/20"
              }`}
            >
              {loadingPush ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : pushStatus.isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Disallow Notification
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Allow Notification
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-stone-500">
            {pushStatus.permission === "denied" ? (
              <span className="text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Notifications are blocked in your browser settings. Please click the padlock / tune icon near the URL bar to allow notifications.
              </span>
            ) : pushStatus.isSubscribed ? (
              <span>Your browser is currently registered for background order pushes.</span>
            ) : (
              <span>Click "Allow Notification" to enable live order alerts on this device.</span>
            )}
          </div>

          <button
            disabled={testingPush || !pushStatus.isSubscribed}
            onClick={handleTestPush}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              pushStatus.isSubscribed
                ? "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300"
                : "opacity-40 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200"
            }`}
          >
            {testingPush ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-primary" />
            )}
            Send Test Notification
          </button>
        </div>
      </div>

      {/* Audio Alerts Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              {soundEnabled ? (
                <Volume2 className="w-6 h-6 text-amber-600" />
              ) : (
                <VolumeX className="w-6 h-6 text-stone-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-black">New Order Sound Alert</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    soundEnabled
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {soundEnabled ? "Sound ON" : "Muted"}
                </span>
              </div>
              <p className="text-sm text-stone-500 mt-1">
                Play an audible chime when new orders arrive in the admin dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-center">
            <button
              onClick={playAlertSound}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              Test Chime
            </button>
            <button
              onClick={handleToggleSound}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
              }`}
            >
              {soundEnabled ? "Mute Sound" : "Enable Sound"}
            </button>
          </div>
        </div>
      </div>

      {/* System & Restaurant Profile Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Store & System Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Restaurant</p>
            <p className="text-base font-black text-black mt-1">Gole Khaja Ghar</p>
            <p className="text-xs text-stone-500">Fast Food & Authentic Khaja</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">PWA Service Worker</p>
            <p className="text-base font-black text-green-700 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Active & Ready
            </p>
            <p className="text-xs text-stone-500">Native push registered</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Live WebSockets / Poll</p>
            <p className="text-base font-black text-primary flex items-center gap-1.5 mt-1">
              <Sparkles className="w-4 h-4 text-primary" />
              Connected
            </p>
            <p className="text-xs text-stone-500">Syncing live order updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
