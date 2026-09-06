import { Link } from "react-router-dom";
import { Package, ShoppingCart, Clock, ArrowRight } from "lucide-react";
import { useAdminLive } from "@/context/AdminLiveContext";

interface AdminDashboardClientProps {
  initialTotalProducts?: number;
  initialAvailableProducts?: number;
  initialTotalOrders?: number;
  initialPendingOrders?: number;
  initialRecentOrders?: any[];
}

export default function AdminDashboardClient({
  initialTotalProducts = 0,
  initialAvailableProducts = 0,
  initialTotalOrders = 0,
  initialPendingOrders = 0,
  initialRecentOrders = [],
}: AdminDashboardClientProps) {
  const { stats, recentOrders } = useAdminLive();

  const totalProducts = stats ? stats.totalProducts : initialTotalProducts;
  const availableProducts = stats ? stats.availableProducts : initialAvailableProducts;
  const totalOrders = stats ? stats.totalOrders : initialTotalOrders;
  const pendingOrders = stats ? stats.pendingOrders : initialPendingOrders;
  const displayOrders = (recentOrders && recentOrders.length > 0) ? recentOrders : (initialRecentOrders || []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-stone-900">Dashboard</h1>
      
      {/* Metrics Grid (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-stone-400 truncate">Total Products</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 leading-tight">{totalProducts}</p>
          </div>
        </div>
        
        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-stone-400 truncate">Available</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 leading-tight">{availableProducts}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-stone-400 truncate">Total Orders</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 leading-tight">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-stone-400 truncate">Pending Orders</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-stone-900 leading-tight flex items-center gap-2">
              {pendingOrders}
              {pendingOrders > 0 && (
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-stone-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
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
                  <td colSpan={5} className="block md:table-cell p-8 text-center text-stone-400 font-medium">No orders found.</td>
                </tr>
              ) : (
                displayOrders.map((order: any) => {
                  const orderId = order._id?.toString() || order.id;
                  return (
                    <tr key={orderId} className="block md:table-row bg-white md:bg-transparent border border-stone-150 md:border-0 rounded-xl p-4 mb-4 md:mb-0 space-y-2.5 md:space-y-0 relative shadow-sm md:shadow-none hover:bg-stone-50 transition-colors">
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">Order #</span>
                        <Link to={`/admin/orders/${orderId}`} className="font-bold text-primary hover:underline cursor-pointer">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-bold text-stone-700">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">Customer</span>
                        <span>{order.customerInfo?.name || "Customer"}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-black text-stone-900">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">Amount</span>
                        <span>Rs. {order.totalAmount?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">Status</span>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600 animate-pulse' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-0 md:p-4 last:border-0 pt-1 md:pt-0 text-sm font-bold text-stone-500 capitalize">
                        <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">Type</span>
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
