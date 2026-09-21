import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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

export default function AdminPushBroadcastCard() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<{ customers: number; admins: number; total: number }>({
    customers: 0,
    admins: 0,
    total: 0,
  });
  const [scheduleStatus, setScheduleStatus] = useState<{
    autoEnabled: boolean;
    nepalCurrentTime: string;
    nepalCurrentDate: string;
    nepalFullFormatted: string;
    nextScheduledSlot: any;
    slots: ScheduleSlot[];
    recentBroadcasts: BroadcastHistoryItem[];
  } | null>(null);

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, schedRes, tmplRes] = await Promise.allSettled([
        api.push.getSubscribersCount(),
        api.push.getScheduleStatus(),
        api.push.getTemplates(),
      ]);

      if (subsRes.status === "fulfilled" && subsRes.value.success) {
        setSubscribers({
          customers: subsRes.value.customers,
          admins: subsRes.value.admins,
          total: subsRes.value.total,
        });
      }

      if (schedRes.status === "fulfilled" && schedRes.value.success) {
        setScheduleStatus(schedRes.value as any);
      }

      if (tmplRes.status === "fulfilled" && tmplRes.value.success) {
        setTemplates(tmplRes.value.templates || []);
      }
    } catch (err: any) {
      console.error("[AdminPushBroadcastCard] Load data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // Background silent refresh for current time & status
      api.push.getScheduleStatus().then((res) => {
        if (res.success) setScheduleStatus(res as any);
      }).catch(() => {});
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
    setFeedback({
      type: "success",
      message: `Template "${tmpl.name}" loaded into composer.`,
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleMasterAuto = async () => {
    if (!scheduleStatus) return;
    setTogglingMaster(true);
    try {
      const next = !scheduleStatus.autoEnabled;
      const res = await api.push.updateScheduleStatus({ autoEnabled: next });
      if (res.success) {
        setScheduleStatus((prev: any) => ({ ...prev, autoEnabled: next }));
        setFeedback({
          type: "success",
          message: next
            ? "Auto Daily Push engine activated! Notifications will send automatically at scheduled times."
            : "Auto Daily Push engine paused.",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update scheduler." });
    } finally {
      setTogglingMaster(false);
    }
  };

  const handleToggleSlot = async (slotId: string, currentEnabled: boolean) => {
    setTogglingSlot(slotId);
    try {
      const res = await api.push.updateScheduleStatus({
        slotId,
        updates: { enabled: !currentEnabled },
      });
      if (res.success) {
        setScheduleStatus((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            slots: prev.slots.map((s: ScheduleSlot) =>
              s.id === slotId ? { ...s, enabled: !currentEnabled } : s
            ),
          };
        });
        setFeedback({
          type: "success",
          message: `Slot updated.`,
        });
      }
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
      const res = await api.push.broadcast(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `🚀 Broadcast delivered successfully! Reached ${res.result.recipientsCount} subscribed device(s).`,
        });
        // Refresh schedule state to update recent broadcasts
        api.push.getScheduleStatus().then((sRes) => {
          if (sRes.success) setScheduleStatus(sRes as any);
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to broadcast notification.",
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
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-orange-950 p-5 sm:p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Gole Khaja Ghar Smart Push Hub
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Hotel & Meal Push Notifications</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              Automated meal-time alerts (Morning, Afternoon, 4 PM Khaja, Night Party & 9 PM Closing) + on-demand hotel marketing broadcasts.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-stone-800/80 backdrop-blur border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Subscribers</div>
                <div className="text-sm font-black text-white">
                  {subscribers.customers} <span className="text-xs font-normal text-stone-400">Cust</span> / {subscribers.admins} <span className="text-xs font-normal text-stone-400">Admin</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-800/80 backdrop-blur border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Nepal Time (UTC+5:45)</div>
                <div className="text-sm font-black text-amber-300">
                  {scheduleStatus?.nepalCurrentTime || "--:--"} <span className="text-xs font-normal text-stone-400">NPT</span>
                </div>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-stone-200 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Master Auto-Schedule Toggle Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-900/50 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${scheduleStatus?.autoEnabled ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Automated Daily Schedule:{" "}
                <span className={scheduleStatus?.autoEnabled ? "text-emerald-400" : "text-stone-400"}>
                  {scheduleStatus?.autoEnabled ? "ACTIVE (Running Automatically)" : "PAUSED"}
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                {scheduleStatus?.nextScheduledSlot ? (
                  <>
                    Next upcoming: <strong className="text-amber-300">{scheduleStatus.nextScheduledSlot.name}</strong> at{" "}
                    <span className="text-white font-semibold">{scheduleStatus.nextScheduledSlot.timeNPT} NPT</span> ({scheduleStatus.nextScheduledSlot.targetDay})
                  </>
                ) : (
                  "All schedule slots are configured below."
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleMasterAuto}
            disabled={togglingMaster}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              scheduleStatus?.autoEnabled
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-emerald-500 text-white hover:bg-emerald-600 font-black"
            }`}
          >
            {togglingMaster ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : scheduleStatus?.autoEnabled ? (
              "Pause Auto Schedule"
            ) : (
              "Activate Auto Schedule"
            )}
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 px-5 flex items-center justify-between text-xs font-medium border-b ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 ml-3 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-8">
        {/* SECTION 1: Daily Auto-Schedule Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Daily Scheduled Push Slots (Nepal Time UTC+5:45)
              </h3>
              <p className="text-xs text-stone-500">
                These notifications trigger automatically once per day when auto-schedule is active, or can be triggered manually anytime.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {scheduleStatus?.slots?.map((slot) => {
              const isMorning = slot.id.includes("morning");
              const isLunch = slot.id.includes("lunch");
              const isKhaja = slot.id.includes("khaja");
              const isParty = slot.id.includes("party");
              const isClosing = slot.id.includes("close");

              const icon = isMorning ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : isLunch ? (
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              ) : isKhaja ? (
                <Flame className="w-4 h-4 text-red-500" />
              ) : isParty ? (
                <Sparkles className="w-4 h-4 text-purple-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              );

              const template = templates.find((t) => t.id === slot.templateId || t.id === slot.id);

              return (
                <div
                  key={slot.id}
                  className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                    slot.enabled
                      ? "bg-stone-50/80 border-stone-200 hover:border-amber-300 hover:shadow-sm"
                      : "bg-stone-100/60 border-stone-200/60 opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                        {icon}
                        <span className="truncate">{slot.name}</span>
                      </div>
                      <span className="text-xs font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {slot.timeNPT}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {template?.body || "Automatic daily alert"}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1">
                      {slot.sentToday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> Sent Today
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                          Pending Today
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-200/70 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSlot(slot.id, slot.enabled)}
                      disabled={togglingSlot === slot.id}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                        slot.enabled
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                      }`}
                    >
                      {togglingSlot === slot.id ? "..." : slot.enabled ? "Enabled" : "Disabled"}
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
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded shadow-xs transition-colors"
                      title="Send now to all customers"
                    >
                      <Send className="w-3 h-3" />
                      Push Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Hotel & Marketing Presets Library */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                Hotel, Food & Special Marketing Presets
              </h3>
              <p className="text-xs text-stone-500">
                Click any preset to load into composer for quick editing, or broadcast immediately.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
              {[
                { id: "ALL", label: "All Presets" },
                { id: "MEAL", label: "Meals" },
                { id: "PARTY", label: "Party & Night" },
                { id: "HOTEL", label: "Hotel & Dining" },
                { id: "OFFER", label: "Offers" },
                { id: "CLOSING", label: "Closing" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-stone-200 hover:border-amber-400 rounded-xl p-3.5 transition-all hover:shadow-sm flex flex-col justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{t.emoji}</span>
                      <span>{t.name}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-amber-900">{t.title}</div>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{t.body}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    Load Composer
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
                    className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Quick Push
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Live Custom Broadcast Composer & Mobile Preview */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Live Push Notification Broadcast Composer
            </h3>
            <p className="text-xs text-stone-500">
              Compose a custom notification or tweak loaded preset. Live preview updates on the right in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4 bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) => setComposer({ ...composer, title: e.target.value })}
                  placeholder="e.g. 🥟 Khaja Time Special!"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider">
                  Notification Message Body *
                </label>
                <textarea
                  rows={3}
                  value={composer.body}
                  onChange={(e) => setComposer({ ...composer, body: e.target.value })}
                  placeholder="Enter compelling message text with emojis..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider">
                    Target Click URL
                  </label>
                  <input
                    type="text"
                    value={composer.url}
                    onChange={(e) => setComposer({ ...composer, url: e.target.value })}
                    placeholder="/shop or /contact"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider">
                    Audience Target
                  </label>
                  <select
                    value={composer.targetRole}
                    onChange={(e) => setComposer({ ...composer, targetRole: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="CUSTOMER">👥 All Subscribed Customers ({subscribers.customers})</option>
                    <option value="ADMIN">🛡️ Admin & Staff Test Only ({subscribers.admins})</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSendBroadcast()}
                  disabled={broadcasting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {broadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Broadcasting to Devices...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Live Push Broadcast 🚀
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
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Test on Admin Phone
                </button>
              </div>
            </div>

            {/* Right Column: Device Push Mockup Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-stone-900 p-5 rounded-2xl border border-stone-800 text-white shadow-inner">
              <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 self-start">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Notification Preview (Phone / Desktop)
              </div>

              {/* Mockup Card */}
              <div className="w-full bg-stone-800/90 border border-white/15 rounded-2xl p-4 shadow-xl space-y-2 backdrop-blur relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 tracking-tight">
                        GOLE KHAJA GHAR • NOW
                      </span>
                      <span className="text-[10px] text-stone-400">just now</span>
                    </div>

                    <div className="text-xs font-black text-white leading-tight">
                      {composer.title || "Notification Title"}
                    </div>

                    <p className="text-[11px] text-stone-300 leading-relaxed break-words">
                      {composer.body || "Notification message will appear here..."}
                    </p>

                    <div className="pt-1.5 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Click to open: <code className="text-amber-300">{composer.url}</code></span>
                      <span className="text-emerald-400 font-semibold">WebPush 🔔</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-stone-400 mt-4 text-center">
                This notification will pop up on customer lock-screens, browser notification centers, and trigger the audio alert chime.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Recent Broadcast History */}
        {scheduleStatus?.recentBroadcasts && scheduleStatus.recentBroadcasts.length > 0 && (
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-stone-800 uppercase tracking-wider">
              Recent Push Broadcast History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 text-stone-700 font-black">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Notification Title & Message</th>
                    <th className="p-2.5">URL Target</th>
                    <th className="p-2.5 text-center">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {scheduleStatus.recentBroadcasts.slice(0, 5).map((h, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="p-2.5 text-stone-500 whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-stone-900">{h.title}</div>
                        <div className="text-stone-500 text-[11px] line-clamp-1">{h.body}</div>
                      </td>
                      <td className="p-2.5 text-amber-700 font-mono text-[11px]">{h.url}</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {h.deliveredCount} devices
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
