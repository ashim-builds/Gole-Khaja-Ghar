import { api } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { subscribeToEvent, playAudioAlert, showLiveNotification, unlockAudioAlerts } from "@/lib/socket";

interface AdminStats {
  totalProducts: number;
  availableProducts: number;
  totalOrders: number;
  pendingOrders: number;
  readyOrders?: number;
  ready?: number;
  preparing?: number;
}

interface OrderItem {
  productName: string;
  qty: number;
  calculatedPrice: number;
}

interface OrderData {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  totalAmount: number;
  orderType: "pickup" | "delivery";
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: string;
  items: OrderItem[];
}

interface AdminLiveContextType {
  stats: AdminStats | null;
  recentOrders: OrderData[];
  newOrderNotification: {
    show: boolean;
    orderNumber: string;
    customerName: string;
    amount: number;
  } | null;
  dismissNotification: () => void;
}

const AdminLiveContext = createContext<AdminLiveContextType | undefined>(undefined);

export function useAdminLive() {
  const context = useContext(AdminLiveContext);
  if (!context) {
    throw new Error("useAdminLive must be used within an AdminLiveProvider");
  }
  return context;
}

const playNotificationSound = () => {
  const soundEnabled = localStorage.getItem("gole_sound_alerts_enabled") !== "false";
  if (soundEnabled) {
    playAudioAlert("order");
  }
};

export function AdminLiveProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [newOrderNotification, setNewOrderNotification] = useState<AdminLiveContextType["newOrderNotification"]>(null);
  
  // Track last seen order numbers to identify brand new orders
  const lastSeenOrderNumber = useRef<string | null>(null);
  const isInitialFetch = useRef<boolean>(true);

  const dismissNotification = () => {
    setNewOrderNotification(null);
  };

  useEffect(() => {
    let active = true;

    // Unlock browser audio context on first user click/touch/keypress in Admin
    const handleUserInteraction = () => {
      unlockAudioAlerts();
    };
    window.addEventListener("click", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });

    async function fetchUpdates() {
      if (!active) return;
      try {
        const result = await api.orders.getAdminLiveUpdates().catch(() => null);
        if (!active || !result || !result.success) return;

        const payload = (result as any).data || result;
        const orders = payload.recentOrders || [];
        const statsData = payload.stats || (result as any).stats || null;

        if (statsData) {
          setStats(statsData);
        }
        setRecentOrders(orders);

        // Check if there's a new order
        if (orders.length > 0) {
          const latestOrder = orders[0];
          
          if (!isInitialFetch.current && lastSeenOrderNumber.current && latestOrder.orderNumber !== lastSeenOrderNumber.current) {
            playNotificationSound();
            setNewOrderNotification({
              show: true,
              orderNumber: latestOrder.orderNumber,
              customerName: latestOrder.customerInfo?.name || "Customer",
              amount: latestOrder.totalAmount || 0,
            });
            void showLiveNotification(
              `🍲 New Order #${latestOrder.orderNumber}`,
              `${latestOrder.customerInfo?.name || "Customer"} • Rs. ${Number(latestOrder.totalAmount || 0).toFixed(2)} (${latestOrder.orderType || "Order"})`,
              `admin-order-${latestOrder.orderNumber}`,
              `/admin/orders`
            );
          }
          
          // Update ref with latest order number
          lastSeenOrderNumber.current = latestOrder.orderNumber;
        }

        isInitialFetch.current = false;
      } catch (err) {
        console.error("Failed to fetch live admin updates:", err);
      }
    }

    // Fetch immediately on mount
    fetchUpdates();

    // Subscribe to real-time order and payment broadcasts
    const unsubCreated = subscribeToEvent("order:created", (data?: any) => {
      if (data && data.orderNumber) {
        lastSeenOrderNumber.current = data.orderNumber;
        playNotificationSound();
        setNewOrderNotification({
          show: true,
          orderNumber: data.orderNumber,
          customerName: data.customerName || "Customer",
          amount: Number(data.totalAmount || 0),
        });
        void showLiveNotification(
          `🍲 New Order #${data.orderNumber}`,
          `${data.customerName || "Customer"} • Rs. ${Number(data.totalAmount || 0).toFixed(2)} (${data.orderType || "Order"})`,
          `admin-order-${data.orderNumber}`,
          `/admin/orders`
        );
      }
      fetchUpdates();
    });

    const unsubAdminNotif = subscribeToEvent("notification:admin", (payload?: any) => {
      if (payload && payload.title && !payload.title.toLowerCase().includes("test")) {
        playNotificationSound();
      }
      fetchUpdates();
    });

    const unsubStatus = subscribeToEvent("order:status_changed", () => {
      fetchUpdates();
    });
    const unsubPayment = subscribeToEvent("payment:recorded", () => {
      fetchUpdates();
    });
    const unsubKot = subscribeToEvent("kot:status_changed", () => {
      fetchUpdates();
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUpdates();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    // Fallback sync every 45s only when visible (WebSockets handle instant push)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUpdates();
      }
    }, 45000);

    return () => {
      active = false;
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      unsubCreated();
      unsubAdminNotif();
      unsubStatus();
      unsubPayment();
      unsubKot();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  return (
    <AdminLiveContext.Provider value={{ stats, recentOrders, newOrderNotification, dismissNotification }}>
      {children}
    </AdminLiveContext.Provider>
  );
}
