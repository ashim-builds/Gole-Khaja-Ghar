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
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Share2,
  Power,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import {
  checkPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushManager";
import { api } from "@/lib/api";
import { StoreOperationalMode } from "@/lib/storeHours";

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
    const status = await checkPushSubscription();
    setPushStatus(status);
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
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(
        880,
        audioCtx.currentTime + 0.15,
      ); // A5
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Settings & Store Control
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Store open/close controls, live push alerts, kitchen chime, and business info
          </p>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {(pushFeedback || storeFeedback) && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-3 border text-xs sm:text-sm font-semibold transition-all shadow-xs ${
            (storeFeedback || pushFeedback)?.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {(storeFeedback || pushFeedback)?.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{(storeFeedback || pushFeedback)?.text}</span>
        </div>
      )}

      {/* 1. STORE OPEN / CLOSE OPERATIONAL CONTROLS */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-xs border border-stone-200/90 space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                storeStatus.isOpen
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              <Power className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                  Store Status & Orders
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                    storeStatus.isOpen
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-red-100 text-red-900 border-red-300"
                  }`}
                >
                  {storeStatus.isOpen ? "🟢 OPEN" : "🔴 CLOSED"}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate hidden xs:block">
                {storeStatus.reason}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[9px] font-bold text-stone-400 block uppercase">
              Mode
            </span>
            <span className="text-[11px] font-extrabold text-stone-800">
              {storeStatus.mode === "MANUAL_OPEN"
                ? "Open (Manual)"
                : storeStatus.mode === "MANUAL_CLOSED"
                ? "Closed (Manual)"
                : "Auto (8AM–9PM)"}
            </span>
          </div>
        </div>

        {/* Compact Horizontal 3-Way Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          {/* Option A: Auto */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("AUTO")}
            disabled={updatingStore}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${
              storeStatus.mode === "AUTO"
                ? "bg-white text-orange-600 font-black shadow-xs border border-orange-200"
                : "text-stone-600 hover:text-stone-900 font-bold hover:bg-white/60"
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${storeStatus.mode === "AUTO" ? "text-orange-600" : "text-stone-400"}`} />
            <span className="text-[11px] leading-tight">Auto Schedule</span>
          </button>

          {/* Option B: Force Open */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("MANUAL_OPEN")}
            disabled={updatingStore}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${
              storeStatus.mode === "MANUAL_OPEN"
                ? "bg-emerald-600 text-white font-black shadow-xs"
                : "text-stone-600 hover:text-emerald-700 font-bold hover:bg-white/60"
            }`}
          >
            <Unlock className={`w-3.5 h-3.5 ${storeStatus.mode === "MANUAL_OPEN" ? "text-white" : "text-emerald-600"}`} />
            <span className="text-[11px] leading-tight">Force Open</span>
          </button>

          {/* Option C: Force Closed */}
          <button
            type="button"
            onClick={() => handleUpdateStoreMode("MANUAL_CLOSED")}
            disabled={updatingStore}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-95 ${
              storeStatus.mode === "MANUAL_CLOSED"
                ? "bg-red-600 text-white font-black shadow-xs"
                : "text-stone-600 hover:text-red-700 font-bold hover:bg-white/60"
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${storeStatus.mode === "MANUAL_CLOSED" ? "text-white" : "text-red-600"}`} />
            <span className="text-[11px] leading-tight">Force Close</span>
          </button>
        </div>

        {/* Compact custom note input */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            type="text"
            value={customReasonInput}
            onChange={(e) => setCustomReasonInput(e.target.value)}
            placeholder="Custom closure note (e.g. Closed early for festival / event)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-[11px] text-stone-900 focus:outline-none focus:border-orange-500 font-medium"
          />
          {customReasonInput && (
            <button
              onClick={() => handleUpdateStoreMode(storeStatus.mode)}
              disabled={updatingStore}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer shrink-0 active:scale-95"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* 2. RESTAURANT PROFILE & QUICK TERMINALS */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-stone-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                Gole Khaja Ghar Profile
              </h2>
              <p className="text-[11px] text-stone-500">
                Official location, timings, and contact
              </p>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-200/60"
          >
            <span>Customer Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Info Grid - 2 Column Horizontal on all screens */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
          <div className="p-2.5 sm:p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[9px] sm:text-[10px] uppercase truncate">
                Location
              </p>
              <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs mt-0.5 leading-snug">
                Sisuwa, Pokhara-29, Nepal
              </p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-start gap-2">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[9px] sm:text-[10px] uppercase truncate">
                WhatsApp / Call
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <a
                  href="tel:+9779804146136"
                  className="font-extrabold text-stone-800 text-[11px] sm:text-xs hover:text-emerald-600 truncate"
                >
                  9804146136
                </a>
                <span className="text-stone-400 text-[11px]">/</span>
                <a
                  href="tel:+9779846011810"
                  className="font-extrabold text-stone-800 text-[11px] sm:text-xs hover:text-emerald-600 truncate"
                >
                  9846011810
                </a>
              </div>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[9px] sm:text-[10px] uppercase truncate">
                Hours
              </p>
              <p className="font-extrabold text-stone-800 text-[11px] sm:text-xs mt-0.5 leading-tight">
                8:00 AM – 9:00 PM
              </p>
              <span className="text-[9px] font-semibold text-amber-800 bg-amber-100/80 px-1 rounded mt-0.5 inline-block truncate max-w-full">
                Closed 1st Tue
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-start gap-2">
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-stone-400 text-[9px] sm:text-[10px] uppercase truncate">
                Social
              </p>
              <a
                href="https://www.facebook.com/raju.tamang.59406"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-blue-600 text-[11px] sm:text-xs mt-0.5 hover:underline flex items-center gap-1 truncate"
              >
                <span className="truncate">Raju Tamang</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick App Terminal Launchers */}
        <div className="pt-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-2">
            Quick Application Launchers
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/pos"
              className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
              <span className="text-[11px] font-bold">POS Terminal</span>
            </Link>

            <Link
              to="/kitchen"
              className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold">Kitchen KDS</span>
            </Link>

            <Link
              to="/admin/billing"
              className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold">Billing Desk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 & 4. NOTIFICATIONS & AUDIO ALERTS (Horizontal 2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* PUSH NOTIFICATIONS */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-stone-200/90 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0">
                {pushStatus.isSubscribed ? (
                  <Bell className="w-4 h-4 text-orange-600" />
                ) : (
                  <BellOff className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                    Push Notifications
                  </h2>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      pushStatus.isSubscribed
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : pushStatus.permission === "denied"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {pushStatus.isSubscribed
                      ? "Active"
                      : pushStatus.permission === "denied"
                      ? "Blocked"
                      : "Disabled"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                  Instant pop-up alerts on order arrival
                </p>
              </div>
            </div>
          </div>

          {/* Action Controls - Horizontal */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              disabled={loadingPush}
              onClick={handleTogglePush}
              className={`py-2 px-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
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
              disabled={testingPush || !pushStatus.isSubscribed}
              onClick={handleTestPush}
              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
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
              <span>Test Alert</span>
            </button>
          </div>
        </div>

        {/* AUDIO ALERTS */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-stone-200/90 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                    Order Audio Chime
                  </h2>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      soundEnabled
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {soundEnabled ? "Sound ON" : "Muted"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
                  Audible ding chime on new orders
                </p>
              </div>
            </div>
          </div>

          {/* Action Controls - Horizontal */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={playAlertSound}
              className="py-2 px-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-stone-200/80"
            >
              <span>Test Sound 🔔</span>
            </button>

            <button
              onClick={handleToggleSound}
              className={`py-2 px-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                soundEnabled
                  ? "bg-amber-500 text-black hover:bg-amber-400 shadow-xs font-black"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
              }`}
            >
              {soundEnabled ? "Mute" : "Unmute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
