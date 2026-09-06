import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";
import { Loader2 } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.orders
      .getAdminOrders({ limit: 50 })
      .then((res) => {
        if (isMounted) {
          setOrders(res.orders || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin orders:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-stone-900">Orders</h1>
      <AdminOrdersClient initialOrders={orders} />
    </div>
  );
}
