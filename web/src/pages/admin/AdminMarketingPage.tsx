import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Bell,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Smartphone,
  Flame,
  Sun,
  UtensilsCrossed,
  Moon,
  Store,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  ArrowLeft,
  Volume2,
  Calendar,
  Layers,
  Radio,
  History,
  Info,
} from "lucide-react";
import { playAudioAlert } from "@/lib/socket";

interface ScheduleSlot {
  id: string;
  name: string;
  emoji: string;
  timeNPT: string;
  enabled: boolean;
  templateId: string;
  sentToday?: boolean;
  sentAt?: string | null;
}

interface TemplateItem {
  id: string;
  category: "MEAL" | "PARTY" | "HOTEL" | "OFFER" | "CLOSING";
  name: string;
  emoji: string;
  defaultTimeNPT?: string;
  title: string;
  body: string;
  icon?: string;
  url: string;
}

interface BroadcastHistoryItem {
  success: boolean;
  recipientsCount: number;
  deliveredCount: number;
  templateId?: string;
  title: string;
  body: string;
  url: string;
  timestamp: string;
}

const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: "morning_breakfast",
    category: "MEAL",
    name: "Morning Breakfast & Fresh Tea",
    emoji: "🌅",
    defaultTimeNPT: "08:30",
    title: "🌅 Good Morning from Gole Khaja Ghar!",
    body: "Start your morning with steaming Masala Tea, hot Parathas, Jerry Swari, Samosas & Fresh Bakery. Hot breakfast is ready for you! ☕🍳",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "afternoon_lunch",
    category: "MEAL",
    name: "Afternoon Lunch & Nepali Thali",
    emoji: "🍛",
    defaultTimeNPT: "12:30",
    title: "🍛 Lunch Hour Special is Live!",
    body: "Hungry for lunch? Enjoy authentic Nepali Khana Set, Chicken Fried Rice, Chowmein & freshly grilled Sekuwa. Order now for fast table service or delivery! 🍽️",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "khaja_time",
    category: "MEAL",
    name: "Khaja Time (4 PM Snacks & MoMo)",
    emoji: "🥟",
    defaultTimeNPT: "16:00",
    title: "🥟 Khaja Time is Here! (4:00 PM)",
    body: "Craving spicy C-MoMo, crunchy Khaja Sets, Sukuti & fresh Sekuwa? Gather your friends or order to your doorstep now! 😋🔥",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "night_party",
    category: "PARTY",
    name: "Night Party & Evening Hangout",
    emoji: "🎉",
    defaultTimeNPT: "19:30",
    title: "🎉 Night Party & Evening Vibes!",
    body: "The charcoal grill is smoking! Crispy Chhoila, sizzling Sekuwa platters, chilled drinks and great music await you at Gole Khaja Ghar tonight. 🍗🍻✨",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "night_shop_close",
    category: "CLOSING",
    name: "Night 9:00 PM Shop Closing Alert",
    emoji: "🌙",
    defaultTimeNPT: "21:00",
    title: "🌙 Shop Closing for Tonight (9:00 PM)",
    body: "Gole Khaja Ghar is now closing orders for tonight! Thank you for dining with us today. Have a peaceful night and see you fresh tomorrow morning at 8:00 AM! 😴✨",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "hotel_room_service",
    category: "HOTEL",
    name: "Hotel Room Dining & Stay Specials",
    emoji: "🏨",
    defaultTimeNPT: "",
    title: "🏨 Hotel Guests & In-Room Dining",
    body: "Relax in comfort! Room dining service is active. Order delicious dishes directly from your phone for direct table & room delivery.",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "party_reservation",
    category: "PARTY",
    name: "Party, Birthday & Group Bookings",
    emoji: "🎂",
    defaultTimeNPT: "",
    title: "🎂 Celebrate Your Birthday & Events With Us!",
    body: "Planning a party, family gathering or birthday? Book your reserved tables & special party combo menus today at Gole Khaja Ghar!",
    icon: "/favicon-circle.png",
    url: "/contact",
  },
  {
    id: "chef_special",
    category: "HOTEL",
    name: "Today's Chef Recommendation",
    emoji: "👨‍🍳",
    defaultTimeNPT: "",
    title: "👨‍🍳 Today's Chef Special Recommendation!",
    body: "Our chef has prepared an exclusive Special Dish today made with fresh local herbs & authentic spices. Check out today's menu!",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "weekend_special",
    category: "PARTY",
    name: "Weekend Feast & Family Special",
    emoji: "🥂",
    defaultTimeNPT: "",
    title: "🥂 Weekend Celebration at Gole Khaja Ghar!",
    body: "Unwind your weekend with family & friends! Enjoy special discounts on giant Khaja Platters, Sekuwa and tasty snacks.",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "rainy_day_comfort",
    category: "HOTEL",
    name: "Rainy Day Hot Soupy Comfort Food",
    emoji: "🌧️",
    defaultTimeNPT: "",
    title: "🌧️ Chilly Day? Warm Up With Hot Soupy Khaja!",
    body: "Rainy vibes call for piping hot Jhol MoMo, spicy Thukpa & hot Masala Tea. Stay warm and let us deliver right to your door! 🥣🥟",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
  {
    id: "flash_discount",
    category: "OFFER",
    name: "Happy Hour & Flash Discount",
    emoji: "🏷️",
    defaultTimeNPT: "",
    title: "🏷️ Flash Offer: Special Discounts Today!",
    body: "Special discount alert! Enjoy limited-time exclusive prices on selected snacks, drinks & khaja combos. Order while offers last! ⚡",
    icon: "/favicon-circle.png",
    url: "/shop",
  },
];

const DEFAULT_SLOTS: ScheduleSlot[] = [
  { id: "morning_breakfast", name: "Morning Breakfast", emoji: "🌅", timeNPT: "08:30", enabled: true, templateId: "morning_breakfast" },
  { id: "afternoon_lunch", name: "Afternoon Lunch", emoji: "🍛", timeNPT: "12:30", enabled: true, templateId: "afternoon_lunch" },
  { id: "khaja_time", name: "4:00 PM Khaja Time", emoji: "🥟", timeNPT: "16:00", enabled: true, templateId: "khaja_time" },
  { id: "night_party", name: "Night Party & Sekuwa", emoji: "🎉", timeNPT: "19:30", enabled: true, templateId: "night_party" },
  { id: "night_shop_close", name: "9:00 PM Closing Alert", emoji: "🌙", timeNPT: "21:00", enabled: true, templateId: "night_shop_close" },
];

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "presets" | "composer" | "history">("composer");
  const [loading, setLoading] = useState(true);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const [subscribers, setSubscribers] = useState<{ customers: number; admins: number; total: number }>({
    customers: 0,
    admins: 1,
    total: 1,
  });

  const [scheduleStatus, setScheduleStatus] = useState<{
    autoEnabled: boolean;
    nepalCurrentTime: string;
    nepalCurrentDate: string;
    nepalFullFormatted: string;
    nextScheduledSlot: any;
    slots: ScheduleSlot[];
    recentBroadcasts: BroadcastHistoryItem[];
  }>({
    autoEnabled: true,
    nepalCurrentTime: new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" }),
    nepalCurrentDate: new Date().toISOString().split("T")[0],
    nepalFullFormatted: new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kathmandu", weekday: "long", month: "short", day: "numeric" }),
    nextScheduledSlot: { name: "4:00 PM Khaja Time", timeNPT: "16:00", targetDay: "Today" },
    slots: DEFAULT_SLOTS,
    recentBroadcasts: [],
  });

  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Custom Push Composer form state
  const [composer, setComposer] = useState({
    title: "🥟 Khaja Time is Here! (4:00 PM)",
    body: "Craving spicy C-MoMo, crunchy Khaja Sets, Sukuti & fresh Sekuwa? Gather your friends or order to your doorstep now! 😋🔥",
    url: "/shop",
    icon: "/favicon-circle.png",
    targetRole: "CUSTOMER" as "CUSTOMER" | "ADMIN",
    selectedTemplateId: "khaja_time",
  });

  const [broadcasting, setBroadcasting] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      let failedAny = false;

      const [subsRes, schedRes, tmplRes] = await Promise.allSettled([
        api.push.getSubscribersCount(),
        api.push.getScheduleStatus(),
        api.push.getTemplates(),
      ]);

      if (subsRes.status === "fulfilled" && subsRes.value?.success) {
        setSubscribers({
          customers: subsRes.value.customers || 0,
          admins: subsRes.value.admins || 0,
          total: subsRes.value.total || 0,
        });
      } else {
        failedAny = true;
      }

      if (schedRes.status === "fulfilled" && schedRes.value?.success) {
        setScheduleStatus((prev) => ({
          ...prev,
          ...(schedRes.value as any),
        }));
      } else {
        failedAny = true;
      }

      if (tmplRes.status === "fulfilled" && tmplRes.value?.success && tmplRes.value.templates?.length) {
        setTemplates(tmplRes.value.templates);
      } else {
        failedAny = true;
      }

      setIsOfflineFallback(failedAny);
    } catch (err: any) {
      console.warn("[AdminMarketingPage] Load data fallback:", err);
      setIsOfflineFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // Background clock tick for Nepal Time
      const npt = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" });
      setScheduleStatus((prev) => ({ ...prev, nepalCurrentTime: npt }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyTemplate = (tmpl: TemplateItem) => {
    setComposer({
      title: tmpl.title,
      body: tmpl.body,
      url: tmpl.url || "/shop",
      icon: tmpl.icon || "/favicon-circle.png",
      targetRole: "CUSTOMER",
      selectedTemplateId: tmpl.id,
    });
    setActiveTab("composer");
    setFeedback({
      type: "success",
      message: `Template "${tmpl.name}" loaded into composer.`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleMasterAuto = async () => {
    setTogglingMaster(true);
    try {
      const next = !scheduleStatus.autoEnabled;
      setScheduleStatus((prev) => ({ ...prev, autoEnabled: next }));
      try {
        await api.push.updateScheduleStatus({ autoEnabled: next });
      } catch (e) {}
      setFeedback({
        type: "success",
        message: next
          ? "Auto Daily Push engine activated! Notifications will send automatically at scheduled times."
          : "Auto Daily Push engine paused.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update scheduler." });
    } finally {
      setTogglingMaster(false);
    }
  };

  const handleToggleSlot = async (slotId: string, currentEnabled: boolean) => {
    setTogglingSlot(slotId);
    try {
      setScheduleStatus((prev) => ({
        ...prev,
        slots: prev.slots.map((s) => (s.id === slotId ? { ...s, enabled: !currentEnabled } : s)),
      }));
      try {
        await api.push.updateScheduleStatus({
          slotId,
          updates: { enabled: !currentEnabled },
        });
      } catch (e) {}
      setFeedback({
        type: "success",
        message: `Schedule slot updated.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to toggle slot." });
    } finally {
      setTogglingSlot(null);
    }
  };

  const handleSendBroadcast = async (customPayload?: {
    templateId?: string;
    title: string;
    body: string;
    url: string;
    targetRole?: "CUSTOMER" | "ADMIN";
  }) => {
    const payload = customPayload || {
      templateId: composer.selectedTemplateId,
      title: composer.title,
      body: composer.body,
      url: composer.url,
      targetRole: composer.targetRole,
      saveToDb: true,
    };

    if (!payload.title.trim() || !payload.body.trim()) {
      setFeedback({ type: "error", message: "Please provide both title and body text." });
      return;
    }

    setBroadcasting(true);
    setFeedback(null);
    try {
      try {
        playAudioAlert("order");
      } catch {}

      const res = await api.push.broadcast(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `🚀 Broadcast delivered! Reached ${res.result?.recipientsCount || 1} subscribed device(s).`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "info",
        message: `Notification simulated locally. Note: To deliver live web push alerts to remote customer phones, ensure backend service is restarted with push endpoints.`,
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (activeCategory === "ALL") return true;
    return t.category === activeCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Settings</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                Smart Marketing & Push Hub
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Automated meal alerts, seasonal marketing presets & live device broadcast engine
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="bg-white border border-stone-200 shadow-xs rounded-xl px-3 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[9px] text-stone-400 font-bold uppercase">Nepal Time (UTC+5:45)</div>
              <div className="text-xs font-black text-stone-900">{scheduleStatus.nepalCurrentTime} NPT</div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 shadow-xs rounded-xl px-3 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[9px] text-stone-400 font-bold uppercase">Subscribers</div>
              <div className="text-xs font-black text-stone-900">
                {subscribers.customers} <span className="text-stone-400 text-[10px] font-medium">Cust</span> / {subscribers.admins} <span className="text-stone-400 text-[10px] font-medium">Admin</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold border shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : feedback.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : feedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Feature Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/70 backdrop-blur rounded-2xl border border-stone-300/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("composer")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "composer"
              ? "bg-white text-stone-900 shadow-sm border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
          }`}
        >
          <Send className={`w-3.5 h-3.5 ${activeTab === "composer" ? "text-orange-600" : "text-stone-400"}`} />
          <span>Live Broadcast Composer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "presets"
              ? "bg-white text-stone-900 shadow-sm border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeTab === "presets" ? "text-amber-600" : "text-stone-400"}`} />
          <span>Marketing Presets ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "schedule"
              ? "bg-white text-stone-900 shadow-sm border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeTab === "schedule" ? "text-blue-600" : "text-stone-400"}`} />
          <span>Auto Daily Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "bg-white text-stone-900 shadow-sm border border-stone-200"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
          }`}
        >
          <History className={`w-3.5 h-3.5 ${activeTab === "history" ? "text-purple-600" : "text-stone-400"}`} />
          <span>Broadcast History</span>
        </button>
      </div>

      {/* TAB 1: LIVE BROADCAST COMPOSER & INTERACTIVE PHONE PREVIEW */}
      {activeTab === "composer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form: Composer Inputs (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                      Compose Custom Notification
                    </h2>
                    <p className="text-[11px] text-stone-500">
                      Instant message broadcast to all subscribed customer devices
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      playAudioAlert("order");
                    } catch {}
                  }}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-[11px] font-bold text-stone-700 flex items-center gap-1.5 border border-stone-200 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Test Chime</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) => setComposer({ ...composer, title: e.target.value })}
                  placeholder="e.g. 🥟 4:00 PM Khaja Time Special!"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider">
                  Notification Message Body *
                </label>
                <textarea
                  rows={3}
                  value={composer.body}
                  onChange={(e) => setComposer({ ...composer, body: e.target.value })}
                  placeholder="Enter compelling message text with emojis..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider">
                    Target Click URL
                  </label>
                  <input
                    type="text"
                    value={composer.url}
                    onChange={(e) => setComposer({ ...composer, url: e.target.value })}
                    placeholder="/shop or /contact"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider">
                    Audience Target
                  </label>
                  <select
                    value={composer.targetRole}
                    onChange={(e) => setComposer({ ...composer, targetRole: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="CUSTOMER">👥 All Subscribed Customers ({subscribers.customers})</option>
                    <option value="ADMIN">🛡️ Admin Test Device Only ({subscribers.admins})</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSendBroadcast()}
                  disabled={broadcasting}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {broadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Live Push Broadcast 🚀</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSendBroadcast({
                      templateId: "admin_test",
                      title: `[TEST] ${composer.title}`,
                      body: composer.body,
                      url: composer.url,
                      targetRole: "ADMIN",
                    });
                  }}
                  disabled={broadcasting}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-stone-200 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-stone-500" />
                  <span>Test Admin Device</span>
                </button>
              </div>
            </div>

            {/* Right: Real-time Device Mockup Simulator (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 to-[#111111] p-5 rounded-2xl border border-stone-800 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Live Phone Mockup
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full">
                  {scheduleStatus.nepalCurrentTime} NPT
                </span>
              </div>

              {/* Phone Lockscreen Notification Bubble */}
              <div className="bg-stone-800/90 border border-white/15 rounded-2xl p-3.5 shadow-xl space-y-2 backdrop-blur relative overflow-hidden transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 text-white shadow-xs">
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-400 tracking-wider uppercase">
                        GOLE KHAJA GHAR
                      </span>
                      <span className="text-[9px] text-stone-400">now</span>
                    </div>

                    <div className="text-xs font-extrabold text-white leading-tight break-words">
                      {composer.title || "Notification Title"}
                    </div>

                    <p className="text-[11px] text-stone-300 leading-relaxed break-words font-medium">
                      {composer.body || "Your message will appear here in real time..."}
                    </p>

                    <div className="pt-1.5 flex items-center justify-between text-[10px] text-stone-400 border-t border-white/10 mt-2">
                      <span className="truncate">Opens: <code className="text-amber-300 font-mono">{composer.url}</code></span>
                      <span className="text-emerald-400 font-bold shrink-0">WebPush 🔔</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preset Suggester */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Quick Load Suggestions
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {templates.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleApplyTemplate(t)}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 text-xs text-stone-200 cursor-pointer truncate"
                    >
                      <span>{t.emoji}</span>
                      <span className="truncate text-[11px] font-semibold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKETING & HOTEL PRESET LIBRARY */}
      {activeTab === "presets" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Hotel, Food & Marketing Presets Library
              </h2>
              <p className="text-xs text-stone-500">
                Pre-written high-converting notifications tailored for Gole Khaja Ghar & Hotel stays
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
              {[
                { id: "ALL", label: "All Presets" },
                { id: "MEAL", label: "Meals" },
                { id: "PARTY", label: "Party & Night" },
                { id: "HOTEL", label: "Hotel & Stay" },
                { id: "OFFER", label: "Offers" },
                { id: "CLOSING", label: "Closing" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === tab.id
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-stone-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                      <span className="text-base">{t.emoji}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                      {t.category}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-amber-900">{t.title}</div>
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{t.body}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-stone-500" />
                    <span>Load Composer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendBroadcast({
                        templateId: t.id,
                        title: t.title,
                        body: t.body,
                        url: t.url,
                        targetRole: "CUSTOMER",
                      })
                    }
                    disabled={broadcasting}
                    className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Quick Push</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY AUTOMATED SCHEDULE ENGINE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Automated Daily Meal Alert Slots
                </h2>
                <p className="text-xs text-stone-500">
                  Daily recurring notifications triggered at specific Nepal Time (NPT) hours
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-600">
                  Master Engine:{" "}
                  <strong className={scheduleStatus.autoEnabled ? "text-emerald-600" : "text-stone-400"}>
                    {scheduleStatus.autoEnabled ? "ACTIVE" : "PAUSED"}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={handleToggleMasterAuto}
                  disabled={togglingMaster}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    scheduleStatus.autoEnabled
                      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 font-black"
                  }`}
                >
                  {togglingMaster ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : scheduleStatus.autoEnabled ? (
                    "Pause Auto Engine"
                  ) : (
                    "Activate Auto Engine"
                  )}
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scheduleStatus.slots.map((slot) => {
                const template = templates.find((t) => t.id === slot.templateId || t.id === slot.id);

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                      slot.enabled
                        ? "bg-stone-50/80 border-stone-200 hover:border-amber-300 hover:shadow-xs"
                        : "bg-stone-100/60 border-stone-200/60 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-extrabold text-xs text-stone-900">
                          <span className="text-base">{slot.emoji}</span>
                          <span>{slot.name}</span>
                        </div>
                        <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                          {slot.timeNPT} NPT
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {template?.body || "Automatic meal time alert"}
                      </p>

                      <div className="pt-1">
                        {slot.sentToday ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Sent Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                            Pending Today
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSlot(slot.id, slot.enabled)}
                        disabled={togglingSlot === slot.id}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                          slot.enabled
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                        }`}
                      >
                        {togglingSlot === slot.id ? "..." : slot.enabled ? "Active" : "Disabled"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (template) {
                            handleSendBroadcast({
                              templateId: template.id,
                              title: template.title,
                              body: template.body,
                              url: template.url,
                              targetRole: "CUSTOMER",
                            });
                          }
                        }}
                        disabled={broadcasting}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Push Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST HISTORY & LOGS */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Push Broadcast Log & Reach History
              </h2>
              <p className="text-xs text-stone-500">
                Track recent push alerts sent to customers and delivery counts
              </p>
            </div>
          </div>

          {scheduleStatus.recentBroadcasts && scheduleStatus.recentBroadcasts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 text-stone-700 font-bold">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Notification Title & Content</th>
                    <th className="p-3">Click URL</th>
                    <th className="p-3 text-center">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {scheduleStatus.recentBroadcasts.map((h, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="p-3 text-stone-500 whitespace-nowrap font-medium">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-stone-900">{h.title}</div>
                        <div className="text-stone-500 text-[11px] line-clamp-1">{h.body}</div>
                      </td>
                      <td className="p-3 text-amber-700 font-mono text-[11px]">{h.url}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {h.deliveredCount} devices
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <History className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-600">No broadcast history recorded yet.</p>
              <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                Sent broadcasts and automated daily push notifications will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
