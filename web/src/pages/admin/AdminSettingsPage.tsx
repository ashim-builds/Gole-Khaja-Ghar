import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  ChefHat,
  Receipt,
  Share2,
  Power,
  Lock,
  Unlock,
  ArrowRight,
  Radio,
  Grid,
  TrendingUp,
  Users,
  Package,
  ShieldCheck,
} from "lucide-react";
import {
  checkPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushManager";
import { api } from "@/lib/api";
import { StoreOperationalMode } from "@/lib/storeHours";
import { showLiveNotification, playAudioAlert } from "@/lib/socket";

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
  const [pushFeedback, setPushFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Audio Alerts State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("gole_sound_alerts_enabled") !== "false";
  });

  // Store Operational Status State
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean;
    mode: StoreOperationalMode;
    statusText: string;
    badgeLabel: string;
    reason: string;
    nextOpening: string;
    nepalTimeFormatted: string;
    updatedAt?: string;
  }>({
    isOpen: true,
    mode: "AUTO",
    statusText: "Open Now",
    badgeLabel: "Open (8:00 AM – 9:00 PM)",
    reason: "Store operating normally on schedule.",
    nextOpening: "Open until 9:00 PM tonight",
    nepalTimeFormatted: "",
  });

  const [customReasonInput, setCustomReasonInput] = useState("");
  const [updatingStore, setUpdatingStore] = useState(false);
  const [storeFeedback, setStoreFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refreshPushStatus = async () => {
    try {
      const status = await checkPushSubscription();
      setPushStatus(status);
    } catch {}
  };

  const fetchStoreStatus = async () => {
    try {
      const res = await api.store.getAdminStatus();
      if (res.success) {
        setStoreStatus({
          isOpen: res.isOpen,
          mode: res.mode || "AUTO",
          statusText: res.statusText,
          badgeLabel: res.badgeLabel,
          reason: res.reason,
          nextOpening: res.nextOpening,
          nepalTimeFormatted: res.nepalTimeFormatted,
          updatedAt: res.updatedAt,
        });
      }
    } catch (err) {
      console.warn("Could not fetch store status:", err);
    }
  };

  useEffect(() => {
    refreshPushStatus();
    fetchStoreStatus();
  }, []);

  const handleUpdateStoreMode = async (mode: StoreOperationalMode) => {
    setUpdatingStore(true);
    setStoreFeedback(null);
    try {
      const res = await api.store.updateStatus({
        mode,
        customReason: customReasonInput,
      });

      if (res.success) {
        setStoreStatus((prev) => ({
          ...prev,
          isOpen: res.isOpen,
          mode: res.mode,
          statusText: res.statusText,
          badgeLabel: res.badgeLabel,
          reason: res.reason,
          nextOpening: res.nextOpening,
        }));
        setStoreFeedback({
          type: "success",
          text: `Store mode successfully updated to: ${
            mode === "MANUAL_OPEN"
              ? "FORCED OPEN"
              : mode === "MANUAL_CLOSED"
                ? "FORCED CLOSED"
                : "AUTOMATIC SCHEDULE (8 AM – 9 PM)"
          }`,
        });
      }
    } catch (err: any) {
      setStoreFeedback({
        type: "error",
        text: err?.message || "Failed to update store status.",
      });
    } finally {
      setUpdatingStore(false);
    }
  };

  const handleTogglePush = async () => {
    setLoadingPush(true);
    setPushFeedback(null);
    try {
      if (pushStatus.isSubscribed) {
        await unsubscribeFromPush();
        setPushFeedback({
          type: "success",
          text: "Push notifications disabled.",
        });
      } else {
        await subscribeToPush("admin");
        setPushFeedback({
          type: "success",
          text: "Push notifications enabled for Admin device!",
        });
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
      void showLiveNotification(
        "🔔 Admin Notification Test",
        "Your Notification Center is connected! You will receive live order alerts here.",
        "admin-test",
        "/admin",
      );
      const res = await api.admin.testPush();
      if (res.success) {
        setPushFeedback({
          type: "success",
          text: "Test notification sent! Check your notification center & device alerts.",
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
      playAudioAlert("order");
    } catch (e) {
      console.warn("Could not play preview sound", e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Settings & System Control
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Store open/close hours, sound alerts, notification engine, and quick administrative portals
          </p>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {(pushFeedback || storeFeedback) && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            (storeFeedback || pushFeedback)?.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {(storeFeedback || pushFeedback)?.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{(storeFeedback || pushFeedback)?.text}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPushFeedback(null);
              setStoreFeedback(null);
            }}
            className="text-stone-400 hover:text-stone-700 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. HERO FEATURE BANNER: SMART MARKETING & PUSH BROADCAST HUB */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-orange-950 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-amber-900/30 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Push & Customer Engagement</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Smart Marketing & Push Hub</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Automate meal-time push notifications (Morning Breakfast, 12:30 PM Lunch, 4 PM Khaja, Night Sekuwa & 9 PM Closing) and compose live hotel marketing broadcasts.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/admin/marketing"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn cursor-pointer"
            >
              <Radio className="w-4 h-4 text-stone-950" />
              <span>Open Marketing Center</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STORE OPEN / CLOSE OPERATIONAL CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-stone-200/90 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                storeStatus.isOpen
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                  Store Operational Mode & Orders
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                    storeStatus.isOpen
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-red-100 text-red-900 border-red-300"
                  }`}
                >
                  {storeStatus.isOpen ? "🟢 OPEN FOR ORDERS" : "🔴 STORE CLOSED"}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {storeStatus.reason}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
              Current Mode
            </span>
            <span className="text-xs font-black text-stone-800">
              {storeStatus.mode === "MANUAL_OPEN"
                ? "Forced Open"
                : storeStatus.mode === "MANUAL_CLOSED"
                  ? "Forced Closed"
                  : "Auto (8AM–9PM)"}
            </span>
          </div>
        </div>

        {/* 3-Way Segmented Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-stone-100 rounded-xl border border-stone-200/80">
          {/* Option A: Auto */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("AUTO")}
            disabled={updatingStore}
            className={`py-2.5 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
              storeStatus.mode === "AUTO"
                ? "bg-white text-orange-600 font-black shadow-xs border border-orange-200"
                : "text-stone-600 hover:text-stone-900 font-bold hover:bg-white/60"
            }`}
          >
            <Clock
              className={`w-4 h-4 ${storeStatus.mode === "AUTO" ? "text-orange-600" : "text-stone-400"}`}
            />
            <span className="text-xs">Auto Schedule (8 AM – 9 PM)</span>
          </button>

          {/* Option B: Force Open */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("MANUAL_OPEN")}
            disabled={updatingStore}
            className={`py-2.5 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
              storeStatus.mode === "MANUAL_OPEN"
                ? "bg-emerald-600 text-white font-black shadow-xs"
                : "text-stone-600 hover:text-emerald-700 font-bold hover:bg-white/60"
            }`}
          >
            <Unlock
              className={`w-4 h-4 ${storeStatus.mode === "MANUAL_OPEN" ? "text-white" : "text-emerald-600"}`}
            />
            <span className="text-xs">Force Open (Manual)</span>
          </button>

          {/* Option C: Force Closed */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("MANUAL_CLOSED")}
            disabled={updatingStore}
            className={`py-2.5 px-3 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
              storeStatus.mode === "MANUAL_CLOSED"
                ? "bg-red-600 text-white font-black shadow-xs"
                : "text-stone-600 hover:text-red-700 font-bold hover:bg-white/60"
            }`}
          >
            <Lock
              className={`w-4 h-4 ${storeStatus.mode === "MANUAL_CLOSED" ? "text-white" : "text-red-600"}`}
            />
            <span className="text-xs">Force Close (Manual)</span>
          </button>
        </div>

        {/* Custom note input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customReasonInput}
            onChange={(e) => setCustomReasonInput(e.target.value)}
            placeholder="Optional custom closure / holiday announcement note"
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-orange-500 font-medium"
          />
          {customReasonInput && (
            <button
              type="button"
              onClick={() => handleUpdateStoreMode(storeStatus.mode)}
              disabled={updatingStore}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
            >
              Save Note
            </button>
          )}
        </div>
      </div>

      {/* 3. DEVICE SOUND ALERTS & NOTIFICATIONS (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AUDIO CHIME PREFERENCES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200/90 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-amber-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-extrabold text-stone-900">
                    Kitchen Audio Ding Chime
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      soundEnabled
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {soundEnabled ? "Sound ON" : "Muted"}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Play audible chime tone when new orders arrive
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={playAlertSound}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-stone-200/80"
            >
              <span>Test Ding 🔔</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                soundEnabled
                  ? "bg-amber-500 text-stone-950 hover:bg-amber-400 font-black shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
              }`}
            >
              {soundEnabled ? "Mute Sound" : "Enable Sound"}
            </button>
          </div>
        </div>

        {/* PUSH NOTIFICATIONS FOR ADMIN DEVICE */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200/90 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                {pushStatus.isSubscribed ? (
                  <Bell className="w-5 h-5 text-orange-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-stone-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-extrabold text-stone-900">
                    Admin Device Push Alerts
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      pushStatus.isSubscribed
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : pushStatus.permission === "denied"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {pushStatus.isSubscribed
                      ? "Subscribed"
                      : pushStatus.permission === "denied"
                        ? "Blocked"
                        : "Disabled"}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Pop-up alerts on this phone or PC for incoming orders
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingPush}
              onClick={handleTogglePush}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                pushStatus.isSubscribed
                  ? "bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 border border-stone-200"
                  : "bg-orange-600 text-white hover:bg-orange-500 shadow-xs"
              }`}
            >
              {loadingPush ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pushStatus.isSubscribed ? (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={testingPush || !pushStatus.isSubscribed}
              onClick={handleTestPush}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                pushStatus.isSubscribed
                  ? "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-300"
                  : "opacity-40 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200"
              }`}
            >
              {testingPush ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-orange-600" />
              )}
              <span>Test Push</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ADMIN FEATURE PORTALS (QUICK FEATURE LAUNCHERS) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-stone-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
              Admin Feature Portals & Terminals
            </h2>
            <p className="text-xs text-stone-500">
              Quick one-click access to all restaurant modules and screens
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link
            to="/admin/marketing"
            className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Marketing & Push</span>
                <ArrowRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Meal & hotel broadcasts</p>
            </div>
          </Link>

          <Link
            to="/kitchen"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Kitchen KDS</span>
                <ArrowRight className="w-3 h-3 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Chef live cooking screen</p>
            </div>
          </Link>

          <Link
            to="/admin/billing"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Billing Desk</span>
                <ArrowRight className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Counter POS & Thermal print</p>
            </div>
          </Link>

          <Link
            to="/admin/tables"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Table QR Codes</span>
                <ArrowRight className="w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Floor layout & QR download</p>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Sales Reports</span>
                <ArrowRight className="w-3 h-3 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Revenue & sales insights</p>
            </div>
          </Link>

          <Link
            to="/admin/products"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Menu Products</span>
                <ArrowRight className="w-3 h-3 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Dishes, pricing & stock</p>
            </div>
          </Link>

          <Link
            to="/admin/waiters"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Staff & Waiters</span>
                <ArrowRight className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Waiter PINs & access</p>
            </div>
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all flex flex-col justify-between group hover:shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>Customer Site</span>
                <ExternalLink className="w-3 h-3 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Open public live site</p>
            </div>
          </a>
        </div>
      </div>

      {/* 5. RESTAURANT PROFILE & INFORMATION */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-stone-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                Gole Khaja Ghar Profile
              </h2>
              <p className="text-xs text-stone-500">
                Official business location, timings, and contact details
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[10px] uppercase">
                Location
              </p>
              <p className="font-extrabold text-stone-800 text-xs mt-0.5 leading-snug">
                Sisuwa, Pokhara-30, Nepal
              </p>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[10px] uppercase">
                Call / WhatsApp
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <a
                  href="tel:+9779804146136"
                  className="font-extrabold text-stone-800 hover:text-emerald-600"
                >
                  9804146136
                </a>
                <span className="text-stone-400">/</span>
                <a
                  href="tel:+9779846011810"
                  className="font-extrabold text-stone-800 hover:text-emerald-600"
                >
                  9846011810
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[10px] uppercase">
                Opening Hours
              </p>
              <p className="font-extrabold text-stone-800 text-xs mt-0.5">
                8:00 AM – 9:00 PM
              </p>
              <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                Closed 1st Tue of Month
              </span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 flex items-start gap-2.5">
            <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[10px] uppercase">
                Facebook Contact
              </p>
              <a
                href="https://www.facebook.com/raju.tamang.59406"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>Raju Tamang</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
