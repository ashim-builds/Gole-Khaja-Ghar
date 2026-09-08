import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { useAdminLive } from "@/context/AdminLiveContext";

interface AdminDashboardClientProps {
  initialTotalProducts?: number;
  initialAvailableProducts?: number;
  initialTotalOrders?: number;
  initialPendingOrders?: number;
  initialReadyOrders?: number;
  initialRecentOrders?: any[];
}

export default function AdminDashboardClient({
  initialTotalProducts = 0,
  initialAvailableProducts = 0,
  initialTotalOrders = 0,
  initialPendingOrders = 0,
  initialReadyOrders = 0,
  initialRecentOrders = [],
}: AdminDashboardClientProps) {
  const { stats, recentOrders } = useAdminLive();

  const totalProducts =
    typeof stats?.totalProducts === "number"
      ? stats.totalProducts
      : (initialTotalProducts ?? 0);
  const availableProducts =
    typeof stats?.availableProducts === "number"
      ? stats.availableProducts
      : (initialAvailableProducts ?? 0);
  const totalOrders =
    typeof stats?.totalOrders === "number"
      ? stats.totalOrders
      : (initialTotalOrders ?? 0);
  const pendingOrders =
    typeof stats?.pendingOrders === "number"
      ? stats.pendingOrders
      : (initialPendingOrders ?? 0);
  const readyOrders =
    typeof stats?.readyOrders === "number"
      ? stats.readyOrders
      : typeof stats?.ready === "number"
      ? stats.ready
      : (initialReadyOrders ?? 0);

  const displayOrders =
    recentOrders && recentOrders.length > 0
      ? recentOrders
      : initialRecentOrders || [];

  const readyOrdersList = displayOrders.filter(
    (o: any) => (o.status || "").toUpperCase() === "READY"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-3xl font-black text-stone-900">Dashboard</h1>
        {readyOrders > 0 && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{readyOrders} order{readyOrders > 1 ? "s" : ""} ready for pickup/delivery</span>
          </div>
        )}
      </div>

      {/* Metrics Grid (2 cols on mobile, 3 on tablet, 5 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-4">
        {/* Total Products */}
        <Link
          to="/admin/products"
          className="group bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 hover:border-blue-300 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-100 transition-transform">
            <Package className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-stone-400 group-hover:text-blue-600 transition-colors truncate">
              Total Products
            </p>
            <p className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
              {totalProducts}
            </p>
          </div>
        </Link>

        {/* Available Products */}
        <Link
          to="/admin/products"
          className="group bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 hover:border-emerald-300 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-green-100 transition-transform">
            <Package className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-stone-400 group-hover:text-green-600 transition-colors truncate">
              Available
            </p>
            <p className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
              {availableProducts}
            </p>
          </div>
        </Link>

        {/* Total Orders */}
        <Link
          to="/admin/orders"
          className="group bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 hover:border-purple-300 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition-transform">
            <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-stone-400 group-hover:text-purple-600 transition-colors truncate">
              Total Orders
            </p>
            <p className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
              {totalOrders}
            </p>
          </div>
        </Link>

        {/* Pending Orders */}
        <Link
          to="/admin/orders?status=PENDING"
          className="group bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 hover:border-orange-300 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-orange-100 transition-transform">
            <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-stone-400 group-hover:text-orange-600 transition-colors truncate">
              Pending Orders
            </p>
            <p className="text-lg sm:text-xl font-black text-stone-900 leading-tight flex items-center gap-2">
              {pendingOrders}
              {pendingOrders > 0 && (
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </p>
          </div>
        </Link>

        {/* Ready Orders */}
        <Link
          to="/admin/orders?status=READY"
          className="group bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 hover:border-emerald-400 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-100 transition-transform">
            <CheckCircle2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-bold text-stone-400 group-hover:text-emerald-600 transition-colors truncate">
              Ready Orders
            </p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 leading-tight flex items-center gap-2">
              {readyOrders}
              {readyOrders > 0 && (
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </p>
          </div>
        </Link>
      </div>

      {/* Ready Orders Quick Action Banner / List (if any ready orders exist) */}
      {readyOrdersList.length > 0 && (
        <div className="bg-emerald-950/90 border border-emerald-600/50 rounded-2xl p-4 sm:p-5 shadow-lg text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-300">
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <span>Ready for Pickup / Delivery ({readyOrdersList.length})</span>
            </div>
            <Link
              to="/admin/orders?status=READY"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
            >
              View All Ready <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyOrdersList.map((order: any) => {
              const orderId = order._id?.toString() || order.id;
              const isDelivery = (order.orderType || "").toLowerCase() === "delivery";
              const isPickup = (order.orderType || "").toLowerCase() === "pickup";

              return (
                <div
                  key={orderId}
                  className="bg-emerald-900/60 border border-emerald-500/40 rounded-xl p-3 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/orders/${orderId}`}
                          className="font-black text-white hover:underline text-sm"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {isDelivery ? "🚚 Delivery" : isPickup ? "🛍️ Pickup" : "🍽️ Dine-in"}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/90 mt-1 font-semibold">
                        {order.customerInfo?.name || "Customer"}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-300">
                      Rs. {order.totalAmount?.toFixed(0) || "0"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-300/80">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </span>
                    <Link
                      to={`/admin/orders/${orderId}`}
                      className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-stone-950 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                    >
                      View & Settle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-black text-stone-900">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-primary font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline cursor-pointer"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-4 md:p-0">
          <table className="block md:table w-full text-left">
            <thead className="hidden md:table-header-group bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="p-4 font-bold text-stone-500 text-sm">Order #</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Customer</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Amount</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Status</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Type</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-stone-100 md:divide-y-0">
              {displayOrders.length === 0 ? (
                <tr className="block md:table-row bg-white md:bg-transparent">
                  <td
                    colSpan={5}
                    className="block md:table-cell p-8 text-center text-stone-400 font-medium"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                displayOrders.map((order: any) => {
                  const orderId = order._id?.toString() || order.id;
                  const st = (order.status || "").toLowerCase();

                  return (
                    <tr
                      key={orderId}
                      className="block md:table-row bg-white md:bg-transparent border border-stone-150 md:border-0 rounded-xl p-4 mb-4 md:mb-0 space-y-2.5 md:space-y-0 relative shadow-sm md:shadow-none hover:bg-stone-50 transition-colors"
                    >
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                          Order #
                        </span>
                        <Link
                          to={`/admin/orders/${orderId}`}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-bold text-stone-700">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                          Customer
                        </span>
                        <span>{order.customerInfo?.name || "Customer"}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-black text-stone-900">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                          Amount
                        </span>
                        <span>Rs. {order.totalAmount?.toFixed(2) || "0.00"}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                          Status
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            st === "pending"
                              ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                              : st === "ready"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-400 font-black animate-pulse"
                              : st === "preparing"
                              ? "bg-orange-100 text-orange-800 border border-orange-300"
                              : st === "delivered" || st === "completed"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : st === "cancelled"
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-stone-100 text-stone-800 border border-stone-200"
                          }`}
                        >
                          {st === "ready" ? "🟢 Ready" : order.status}
                        </span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 last:border-0 pt-1 md:pt-0 text-sm font-bold text-stone-500 capitalize">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                          Type
                        </span>
                        <span>{order.orderType}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
