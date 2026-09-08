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
      api.products.getAll(),
      api.orders.getAdminOrders({ limit: 15 }),
    ])
      .then(([productsRes, ordersRes]) => {
        if (!isMounted) return;
        const products = productsRes.products || [];
        const orders = ordersRes.orders || [];
        const totalOrders = ordersRes.pagination?.total || orders.length;

        const totalProducts = products.length;
        const availableProducts = products.filter((p: any) => p.isAvailable).length;
        const pendingOrders = orders.filter((o: any) => (o.status || "").toLowerCase() === "pending").length;
        const readyOrders = orders.filter((o: any) => (o.status || "").toLowerCase() === "ready").length;

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
