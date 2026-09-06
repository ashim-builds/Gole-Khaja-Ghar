import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CreditCard,
  Banknote,
  RotateCcw,
  ChefHat,
  ChevronRight,
  ExternalLink,
  Loader2,
  Receipt,
  Printer,
} from "lucide-react";
import { api } from "@/lib/api";
import { subscribeToEvent, playAudioAlert } from "@/lib/socket";
import ThermalReceiptModal from "./ThermalReceiptModal";

interface AdminOrdersClientProps {
  initialOrders?: any[];
}

export default function AdminOrdersClient({ initialOrders = [] }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "ECOMMERCE" | "DINE_IN">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.orders.getAdminOrders({ limit: 100 });
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to live WebSocket updates
    const unsubOrder = subscribeToEvent("order:status_changed", () => {
      playAudioAlert("order");
      fetchOrders();
    });

    const unsubPayment = subscribeToEvent("payment:recorded", () => {
      fetchOrders();
    });

    const unsubKot = subscribeToEvent("kot:status_changed", () => {
      fetchOrders();
    });

    const unsubDelivered = subscribeToEvent("order:delivered", () => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 10000);

    return () => {
      unsubOrder();
      unsubPayment();
      unsubKot();
      unsubDelivered();
      clearInterval(interval);
    };
  }, []);

  const handleTogglePaymentStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "paid" ? "pending" : "paid";
    try {
      setUpdatingPaymentId(orderId);
      const res = await api.orders.updatePayment(orderId, nextStatus);
      if (res.success) {
        const finalPaymentStatus = res.order?.paymentStatus || nextStatus;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId || o._id === orderId
              ? {
                  ...o,
                  paymentStatus: finalPaymentStatus,
                  status: res.order?.status || o.status,
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle payment status:", err);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Filter orders by source (Ecommerce vs Dine-in), status, and search query
  const filteredOrders = orders.filter((order) => {
    const orderType = (order.orderType || "").toLowerCase();
    const orderSource = (order.orderSource || "").toUpperCase();
    const isDineIn = orderType === "dine_in" || orderType === "dine-in" || orderSource === "WAITER" || !!order.tableSessionId;

    if (sourceFilter === "ECOMMERCE" && isDineIn) return false;
    if (sourceFilter === "DINE_IN" && !isDineIn) return false;

    if (statusFilter !== "ALL") {
      const st = (order.status || "").toUpperCase();
      if (st !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (order.orderNumber || "").toLowerCase();
      const name = (order.customerInfo?.name || "").toLowerCase();
      const phone = (order.customerInfo?.phone || "").toLowerCase();
      if (!num.includes(q) && !name.includes(q) && !phone.includes(q)) return false;
    }

    return true;
  });

  const ecommerceCount = orders.filter((o) => {
    const ot = (o.orderType || "").toLowerCase();
    return ot !== "dine_in" && ot !== "dine-in" && o.orderSource !== "WAITER";
  }).length;

  const dineInCount = orders.length - ecommerceCount;

  return (
    <div className="space-y-5">
      {/* Top Segment Control: Ecommerce vs Dine-In Table Orders */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-wrap sm:flex-nowrap p-1 bg-stone-100 rounded-xl gap-1">
          <button
            onClick={() => setSourceFilter("ALL")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              sourceFilter === "ALL"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <span>All Orders</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-stone-200 rounded-full">{orders.length}</span>
          </button>

          <button
            onClick={() => setSourceFilter("ECOMMERCE")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              sourceFilter === "ECOMMERCE"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Online</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-orange-100 text-orange-800 rounded-full font-bold">{ecommerceCount}</span>
          </button>

          <button
            onClick={() => setSourceFilter("DINE_IN")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              sourceFilter === "DINE_IN"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dine-In</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold">{dineInCount}</span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search #, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-orange-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "ALL", label: "All Status" },
          { id: "PENDING", label: "Pending" },
          { id: "CONFIRMED", label: "Confirmed" },
          { id: "PREPARING", label: "In Kitchen" },
          { id: "READY", label: "Ready" },
          { id: "COMPLETED", label: "Completed" },
          { id: "CANCELLED", label: "Cancelled" },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              statusFilter === st.id
                ? "bg-stone-900 border-stone-900 text-white shadow-sm"
                : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* MOBILE ORDERS LIST (PURE DIV CARDS - NO SQUISHED TABLES ON MOBILE) */}
      <div className="block md:hidden space-y-3.5">
        {filteredOrders.map((order: any) => {
          const orderId = order._id?.toString() || order.id;
          const orderType = (order.orderType || "").toLowerCase();
          const isDineIn = orderType === "dine_in" || orderType === "dine-in" || order.orderSource === "WAITER";
          const isPaid = (order.paymentStatus || "").toLowerCase() === "paid";
          const status = (order.status || "").toUpperCase();

          return (
            <div
              key={orderId}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3 relative overflow-hidden"
            >
              {/* Card Header: Order #, Channel Badge, and Time */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-stone-900 tracking-tight">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isDineIn
                          ? "bg-amber-100 text-amber-800"
                          : orderType === "pickup"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {isDineIn ? (
                        <UtensilsCrossed className="w-2.5 h-2.5" />
                      ) : orderType === "pickup" ? (
                        <ShoppingBag className="w-2.5 h-2.5" />
                      ) : (
                        <Truck className="w-2.5 h-2.5" />
                      )}
                      {isDineIn ? "Dine-In" : orderType === "pickup" ? "Pickup" : "Delivery"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Total Price */}
                <div className="text-right">
                  <span className="text-lg font-black text-stone-900">
                    Rs. {Number(order.totalAmount || 0).toFixed(0)}
                  </span>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">
                    {order.paymentMethod === "qr" || order.paymentMethod === "fonepay_qr" || order.paymentMethod === "FONEPAY_QR"
                      ? "FonePay QR"
                      : "Cash / COD"}
                  </p>
                </div>
              </div>

              {/* Customer & Items Summary */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900">{order.customerInfo?.name || "Guest Customer"}</span>
                  {order.customerInfo?.phone && (
                    <a
                      href={`tel:${order.customerInfo.phone}`}
                      className="font-mono text-stone-600 font-semibold text-[11px] hover:text-orange-600"
                    >
                      {order.customerInfo.phone}
                    </a>
                  )}
                </div>

                {order.deliveryAddress && !isDineIn && (
                  <p className="text-[11px] text-stone-500 line-clamp-1">📍 {order.deliveryAddress}</p>
                )}

                {/* Show Assigned Waiter for Dine-In Table Orders */}
                {(order.waiterName || order.tableSession?.waiterName) && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 w-fit">
                    <User className="w-3 h-3 text-amber-700" />
                    <span>Waiter: {order.waiterName || order.tableSession?.waiterName}</span>
                    {(order.waiterCode || order.tableSession?.waiterCode) && (
                      <span className="font-mono text-amber-700 font-semibold">({order.waiterCode || order.tableSession?.waiterCode})</span>
                    )}
                  </div>
                )}

                {/* Items preview */}
                {order.items && order.items.length > 0 && (
                  <div className="pt-1.5 border-t border-stone-200/60 flex flex-wrap gap-1">
                    {order.items.slice(0, 3).map((it: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-700"
                      >
                        {it.quantity}x {it.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-[10px] font-bold bg-stone-200/70 text-stone-600 px-1.5 py-0.5 rounded">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Action Buttons Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Left: Status Badge & Payment Toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      status === "PENDING"
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : status === "PREPARING"
                        ? "bg-blue-100 text-blue-800"
                        : status === "READY"
                        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400"
                        : status === "COMPLETED" || status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {status === "READY" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {status}
                  </span>

                  {/* 1-tap Payment toggle */}
                  <button
                    onClick={() => handleTogglePaymentStatus(orderId, order.paymentStatus)}
                    disabled={updatingPaymentId === orderId}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {updatingPaymentId === orderId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isPaid ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{isPaid ? "PAID" : "UNPAID"}</span>
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
                    title="Print Tax Invoice"
                  >
                    <Receipt className="w-4 h-4 text-stone-700" />
                  </button>
                  <Link
                    to={`/admin/orders/${orderId}`}
                    className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-orange-600" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-bold text-stone-700 text-sm">No orders match your filter</p>
            <p className="text-xs text-stone-400">Try changing status or search criteria.</p>
          </div>
        )}
      </div>

      {/* DESKTOP ORDERS TABLE (HIDDEN ON MOBILE, ACTIVE ON MD+) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Order / Channel</th>
                <th className="p-4">Placed Time</th>
                <th className="p-4">Customer / Table</th>
                <th className="p-4">Kitchen / Delivery Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order: any) => {
                const orderId = order._id?.toString() || order.id;
                const orderType = (order.orderType || "").toLowerCase();
                const isDineIn = orderType === "dine_in" || orderType === "dine-in" || order.orderSource === "WAITER";
                const isPaid = (order.paymentStatus || "").toLowerCase() === "paid";
                const status = (order.status || "").toUpperCase();

                return (
                  <tr key={orderId} className="hover:bg-stone-50 transition-colors">
                    {/* Order & Source Channel */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 text-sm">{order.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isDineIn
                              ? "bg-amber-100 text-amber-800"
                              : orderType === "pickup"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {isDineIn ? <UtensilsCrossed className="w-2.5 h-2.5" /> : orderType === "pickup" ? <ShoppingBag className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                          {isDineIn ? "Dine-In" : orderType === "pickup" ? "Online Pickup" : "Online Delivery"}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                    </td>

                    {/* Placed Date / Time */}
                    <td className="p-4 text-stone-600 font-medium">
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Customer or Table & Waiter */}
                    <td className="p-4">
                      <p className="font-bold text-stone-900 text-xs">{order.customerInfo?.name || "Guest"}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{order.customerInfo?.phone || "-"}</p>
                      {(order.waiterName || order.tableSession?.waiterName) && (
                        <p className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 w-fit mt-0.5">
                          Waiter: {order.waiterName || order.tableSession?.waiterName} {order.waiterCode || order.tableSession?.waiterCode ? `(${order.waiterCode || order.tableSession?.waiterCode})` : ""}
                        </p>
                      )}
                      {order.deliveryAddress && !isDineIn && (
                        <p className="text-[10px] text-stone-400 truncate max-w-xs">{order.deliveryAddress}</p>
                      )}
                    </td>

                    {/* Kitchen / Delivery Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                          status === "PENDING"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : status === "PREPARING"
                            ? "bg-blue-100 text-blue-800"
                            : status === "READY"
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400"
                            : status === "COMPLETED" || status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {status === "READY" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {status}
                      </span>
                    </td>

                    {/* Payment Status & Toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePaymentStatus(orderId, order.paymentStatus)}
                        disabled={updatingPaymentId === orderId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle Paid/Pending"
                      >
                        {updatingPaymentId === orderId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPaid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span className="uppercase text-[10px]">{isPaid ? "PAID" : "UNPAID"}</span>
                      </button>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-stone-500 uppercase font-semibold">
                          {order.paymentMethod === "qr" || order.paymentMethod === "fonepay_qr" || order.paymentMethod === "FONEPAY_QR"
                            ? "FonePay QR"
                            : "Cash / COD"}
                        </span>
                        {order.txRef && (
                          <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                            Tx: {order.txRef}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4">
                      <span className="font-black text-stone-900 text-sm">
                        Rs. {Number(order.totalAmount || 0).toFixed(0)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="p-2 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950 rounded-lg transition-colors cursor-pointer"
                          title="View & Print 80mm Tax Invoice"
                        >
                          <Receipt className="w-4 h-4 text-stone-700" />
                        </button>
                        <Link
                          to={`/admin/orders/${orderId}`}
                          className="p-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400 font-medium">
                    No orders match your selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 80mm Thermal Receipt / Tax Invoice Modal */}
      <ThermalReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
}
