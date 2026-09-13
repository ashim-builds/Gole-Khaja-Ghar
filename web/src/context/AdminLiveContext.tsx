import { api } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { subscribeToEvent, playAudioAlert } from "@/lib/socket";

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
  playAudioAlert('order');
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

    async function fetchUpdates() {
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
              amount: latestOrder.totalAmount
            });
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
    const unsubCreated = subscribeToEvent("order:created", () => {
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

    // Fallback sync every 25 seconds instead of 5 seconds
    const interval = setInterval(fetchUpdates, 25000);

    return () => {
      active = false;
      unsubCreated();
      unsubStatus();
      unsubPayment();
      unsubKot();
      clearInterval(interval);
    };
  }, []);

  return (
    <AdminLiveContext.Provider value={{ stats, recentOrders, newOrderNotification, dismissNotification }}>
      {children}
    </AdminLiveContext.Provider>
  );
}
