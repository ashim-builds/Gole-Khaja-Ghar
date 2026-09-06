"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "@/lib/api";
import { subscribeToEvent } from "@/lib/socket";

interface LiveOrderStatusProps {
  orderNumber: string;
  initialStatus: string;
}

export default function LiveOrderStatus({ orderNumber, initialStatus }: LiveOrderStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.orders.getStatus(orderNumber);
        if (res.success && res.order?.status) {
          setStatus(res.order.status);
        }
      } catch {
        // Ignore polling errors
      }
    };

    const unsub = subscribeToEvent("order:status_changed", (data: any) => {
      if (!data?.orderNumber || data.orderNumber === orderNumber) {
        fetchStatus();
      }
    });

    const interval = setInterval(fetchStatus, 25000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [orderNumber]);

  return (
    <div className="flex items-center gap-2">
      <Clock
        className={`w-5 h-5 ${
          status === "completed" || status === "delivered"
            ? "text-green-500"
            : status === "cancelled"
            ? "text-red-500"
            : "text-primary"
        }`}
      />
      <span
        className={`font-black text-lg capitalize ${
          status === "completed" || status === "delivered"
            ? "text-green-600"
            : status === "cancelled"
            ? "text-red-600"
            : "text-black"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
