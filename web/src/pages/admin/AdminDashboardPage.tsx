import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    totalProducts: number;
    availableProducts: number;
    totalOrders: number;
    pendingOrders: number;
    readyOrders: number;
    recentOrders: any[];
  }>({
    totalProducts: 0,
    availableProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.orders.getAdminLiveUpdates().catch(() => null),
      api.orders.getAdminOrders({ limit: 15 }),
    ])
      .then(([liveRes, ordersRes]) => {
        if (!isMounted) return;
        const liveStats = (liveRes as any)?.stats;
        const orders = ordersRes.orders || [];
        const totalOrders =
          liveStats?.totalOrders ??
          (ordersRes.pagination?.total || orders.length);

        const totalProducts = liveStats?.totalProducts ?? 0;
        const availableProducts = liveStats?.availableProducts ?? 0;
        const pendingOrders =
          liveStats?.pendingOrders ??
          orders.filter(
            (o: any) => (o.status || "").toLowerCase() === "pending",
          ).length;
        const readyOrders =
          liveStats?.readyOrders ??
          orders.filter((o: any) => (o.status || "").toLowerCase() === "ready")
            .length;

        setData({
          totalProducts,
          availableProducts,
          totalOrders,
          pendingOrders,
          readyOrders,
          recentOrders: orders,
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Admin dashboard fetch error:", error);
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
    <AdminDashboardClient
      initialTotalProducts={data.totalProducts}
      initialAvailableProducts={data.availableProducts}
      initialTotalOrders={data.totalOrders}
      initialPendingOrders={data.pendingOrders}
      initialReadyOrders={data.readyOrders}
      initialRecentOrders={data.recentOrders}
    />
  );
}
