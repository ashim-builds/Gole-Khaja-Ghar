import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { subscribeToEvent } from "@/lib/socket";

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

// Synthesize a clean, pleasant notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First chime node
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    // Second chime node
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    
    // Play E5
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Play A5 shortly after
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("Could not play synthesized audio notification (user interaction may be required first):", err);
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

    async function fetchUpdates() {
      try {
        const res = await fetch("/api/admin/live-updates", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;

        const result = await res.json();
        if (!active || !result.success) return;

        const payload = result.data || result;
        const orders = payload.recentOrders || result.recentOrders || [];
        const statsData = payload.stats || result.stats || null;

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
