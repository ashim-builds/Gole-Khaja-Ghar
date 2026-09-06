"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "@/lib/api";

interface LiveOrderStatusProps {
  orderNumber: string;
  initialStatus: string;
}

export default function LiveOrderStatus({ orderNumber, initialStatus }: LiveOrderStatusProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.orders.getStatus(orderNumber);
        if (res.success && res.order?.status) {
          setStatus(res.order.status);
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
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
