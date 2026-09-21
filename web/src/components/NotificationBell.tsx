import { useEffect, useState, useRef, useContext, useCallback } from "react";
import { Bell, BellOff, CheckCircle2, Loader2, Clock, Settings, Sparkles } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { subscribeToEvent, playAudioAlert } from "@/lib/socket";
import { checkPushSubscription, subscribeToPush } from "@/lib/pushManager";

interface NotificationBellProps {
  type: "customer" | "admin";
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function NotificationBell({ type }: NotificationBellProps) {
  const userContext = useContext(UserContext);
  const user = userContext ? userContext.user : null;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  }>({ supported: false, permission: "default", isSubscribed: false });
  const [enablingPush, setEnablingPush] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (type === "customer" && !user) return;
    try {
      const res =
        type === "admin"
          ? await api.notifications.getAdminUnreadCount()
          : await api.notifications.getUserUnreadCount();
      if (res && res.success) {
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Quietly ignore
    }
  }, [type, user]);

  const fetchNotifications = useCallback(async () => {
    if (type === "customer" && !user) return;
    setFetchingNotifications(true);
    try {
      const res =
        type === "admin"
          ? await api.notifications.getAdminList()
          : await api.notifications.getUserList();
      if (res && res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error("[Bell] Failed to fetch notifications:", err);
    } finally {
      setFetchingNotifications(false);
    }
  }, [type, user]);

  const refreshPushState = useCallback(async () => {
    try {
      const status = await checkPushSubscription();
      setPushStatus(status);
    } catch {}
  }, []);

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      await subscribeToPush(type, user?.id);
      await refreshPushState();
    } catch (err) {
      console.warn("[Bell] Enable push failed:", err);
    } finally {
      setEnablingPush(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res =
        type === "admin"
          ? await api.notifications.markAdminRead(id)
          : await api.notifications.markUserRead(id);
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true, isRead: true } : n))
        );
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("[Bell] Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res =
        type === "admin"
          ? await api.notifications.markAdminReadAll()
          : await api.notifications.markUserReadAll();
      if (res && res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("[Bell] Failed to mark all as read:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      refreshPushState();
    }
  }, [isOpen, fetchNotifications, refreshPushState]);

  useEffect(() => {
    if (type === "customer" && !user) return;
    fetchUnreadCount();
    refreshPushState();

    // Subscribe to live socket notification broadcasts
    const handleIncomingNotif = (payload: any) => {
      if (!payload) return;
      
      // Determine if notification belongs to this view
      const belongs =
        type === "admin"
          ? payload.targetRole === "ADMIN" || payload.recipientType === "ROLE_BROADCAST" || !payload.userId
          : payload.userId === user?.id || payload.recipientType === "ROLE_BROADCAST";

      if (belongs) {
        setUnreadCount((c) => c + 1);
        setNotifications((prev) => {
          const item = {
            id: payload.id || payload._id || `notif-${Date.now()}`,
            _id: payload.id || payload._id || `notif-${Date.now()}`,
            title: payload.title,
            message: payload.message || payload.body,
            body: payload.body || payload.message,
            linkUrl: payload.linkUrl,
            read: false,
            isRead: false,
            createdAt: payload.createdAt || new Date().toISOString(),
          };
          // Avoid duplicates
          if (prev.some((n) => (n.id || n._id) === item.id)) return prev;
          return [item, ...prev];
        });
      }
    };

    const unsubAdmin = type === "admin" ? subscribeToEvent("notification:admin", handleIncomingNotif) : null;
    const unsubNew = subscribeToEvent("notification:new", handleIncomingNotif);
    const unsubOrder = type === "admin" ? subscribeToEvent("order:created", () => {
      fetchUnreadCount();
    }) : null;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 45000);

    return () => {
      unsubAdmin?.();
      unsubNew();
      unsubOrder?.();
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [user, type, fetchUnreadCount, refreshPushState]);

  if (type === "customer" && !user) {
    return null;
  }

  const settingsUrl = type === "admin" ? "/admin/settings" : "/account";

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-primary transition-colors focus:outline-none cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ repeat: Infinity, repeatDelay: 10, duration: 0.6 }}
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-primary fill-primary/20" : "text-white"}`} />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#111111] animate-pulse shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute mt-2 bg-stone-950/95 border border-stone-800 rounded-2xl p-4 shadow-2xl z-50 max-md:fixed max-md:top-16 max-md:left-4 max-md:right-4 max-md:w-auto w-84 text-white ${
              type === "admin" ? "left-0" : "right-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-stone-400 hover:text-white underline transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="py-3 space-y-2">
              {fetchingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-stone-600" />
                  <p className="text-xs font-semibold text-stone-300">No new notifications</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">You're all caught up!</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.map((notif) => {
                    const notifId = notif._id || notif.id;
                    const rawTarget = notif.linkUrl || "";
                    const targetUrl =
                      rawTarget ||
                      (type === "admin"
                        ? notif.orderId
                          ? `/admin/orders/${notif.orderId}`
                          : "/admin/orders"
                        : notif.orderId
                        ? `/orders/${notif.orderId}`
                        : "/orders");

                    return (
                      <Link
                        key={notifId}
                        to={targetUrl}
                        onClick={() => {
                          setIsOpen(false);
                          handleMarkAsRead(notifId);
                        }}
                        className={`block rounded-xl p-3 border transition-all text-left ${
                          notif.read || notif.isRead
                            ? "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-90"
                            : "bg-primary/10 border-primary/30 hover:bg-primary/15 shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-black text-white flex items-center gap-1.5 leading-tight">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                            {notif.title}
                            {!notif.read && !notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 self-center" />
                            )}
                          </span>
                          <span className="text-[9px] text-stone-400 shrink-0 font-medium">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-300 mt-1 leading-normal whitespace-pre-line">
                          {notif.message || notif.body}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Push Alert Quick Enable banner if not enabled */}
            {pushStatus.supported && !pushStatus.isSubscribed && (
              <div className="mb-2 p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-orange-200">
                  <Bell className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-pulse" />
                  <span>Enable device push alerts</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={enablingPush}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {enablingPush ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Enable
                </button>
              </div>
            )}

            {/* Footer with Settings Link */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${pushStatus.isSubscribed ? "bg-emerald-500" : "bg-stone-500"}`} />
                {pushStatus.isSubscribed ? "Push active" : "Push off"}
              </span>
              <Link
                to={settingsUrl}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-primary hover:text-white font-semibold transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage in Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
