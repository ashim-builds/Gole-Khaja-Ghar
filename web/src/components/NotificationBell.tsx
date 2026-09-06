import { useEffect, useState, useRef, useContext } from "react";
import { Bell, BellOff, CheckCircle2, Loader2, Clock, Settings } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
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
  };

  const fetchNotifications = async () => {
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
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res =
        type === "admin"
          ? await api.notifications.markAdminRead(id)
          : await api.notifications.markUserRead(id);
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
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
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("[Bell] Failed to mark all as read:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    if (type === "customer" && !user) return;
    fetchUnreadCount();

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("focus", fetchUnreadCount);

    const interval = setInterval(fetchUnreadCount, 25000);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("focus", fetchUnreadCount);
      clearInterval(interval);
    };
  }, [user, type]);

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
                    const targetUrl =
                      type === "admin"
                        ? notif.orderId
                          ? `/admin/orders/${notif.orderId}`
                          : "/admin/orders"
                        : notif.orderId
                        ? `/orders/${notif.orderId}`
                        : "/orders";

                    return (
                      <Link
                        key={notifId}
                        to={targetUrl}
                        onClick={() => {
                          setIsOpen(false);
                          handleMarkAsRead(notifId);
                        }}
                        className={`block rounded-xl p-3 border transition-all text-left ${
                          notif.read
                            ? "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-90"
                            : "bg-primary/10 border-primary/30 hover:bg-primary/15 shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-black text-white flex items-center gap-1.5 leading-tight">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                            {notif.title}
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 self-center" />
                            )}
                          </span>
                          <span className="text-[9px] text-stone-400 shrink-0 font-medium">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-300 mt-1 leading-normal whitespace-pre-line">
                          {notif.message}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Settings Link */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
              <span>Push alerts setting</span>
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
