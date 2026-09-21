import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Phone,
  Loader2,
  Printer,
  Receipt,
  Lock,
  Store,
} from "lucide-react";
import StatusUpdater from "@/components/admin/StatusUpdater";
import PaymentStatusToggle from "@/components/admin/PaymentStatusToggle";
import StaticMapView, { cleanAddressText } from "@/components/StaticMapView";
import ThermalReceiptModal from "@/components/admin/ThermalReceiptModal";
import { api } from "@/lib/api";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);

    api.orders
      .getAdminOrderById(id)
      .then((res) => {
        if (isMounted) {
          setOrder(res.order);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Order not found");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-xl font-black text-stone-900 mb-2">Order Not Found</h2>
        <p className="text-stone-500 mb-4">{error || "Could not load order details."}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 font-bold rounded-lg hover:bg-stone-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = (order.status || "").toLowerCase() === "cancelled";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 bg-white rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isCancelled
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : (order.status || "").toLowerCase() === "delivered" ||
                      (order.status || "").toLowerCase() === "completed"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : (order.status || "").toLowerCase() === "ready"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 ring-1 ring-emerald-400"
                    : (order.status || "").toLowerCase() === "preparing"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>80mm Tax Invoice</span>
          </button>
          <StatusUpdater
            orderId={order._id?.toString() || order.id?.toString()}
            currentStatus={order.status}
            onUpdated={(newStatus) => {
              setOrder((prev: any) =>
                prev ? { ...prev, status: newStatus } : prev
              );
            }}
          />
        </div>
      </div>

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm">Order Cancelled & Locked</p>
            <p className="text-xs text-red-700">
              This order has been cancelled. Changing status and payment modifications are completely disabled.
            </p>
          </div>
        </div>
      )}

      {/* Main Order & Delivery Grid */}
      <div className={`grid grid-cols-1 ${order.orderType === "delivery" ? "lg:grid-cols-12" : "md:grid-cols-2"} gap-5 sm:gap-6`}>
        {/* Left Column: Customer Details + Order Details */}
        <div className={`${order.orderType === "delivery" ? "lg:col-span-5" : "col-span-1"} space-y-5 sm:space-y-6`}>
          {/* Customer Info */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-stone-200/90 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Customer Details
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-xs font-bold text-stone-400">Name</p>
                <p className="font-extrabold text-stone-800">{order.customerInfo?.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400">Phone</p>
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-stone-800">{order.customerInfo?.phone}</p>
                  <a
                    href={`tel:${order.customerInfo?.phone}`}
                    className="text-primary hover:underline text-xs font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200"
                  >
                    Call Customer
                  </a>
                </div>
              </div>
              {order.customerInfo?.email && (
                <div>
                  <p className="text-xs font-bold text-stone-400">Email</p>
                  <p className="font-bold text-stone-800">{order.customerInfo?.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-stone-200/90 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Order Info & Payment
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-xs font-bold text-stone-400">Date Placed</p>
                <p className="font-bold text-stone-800">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400">Type</p>
                <p className="font-bold text-stone-800 capitalize">{order.orderType}</p>
              </div>
              {(order.tableNumber || order.tableSession?.table?.tableNumber) && (
                <div>
                  <p className="text-xs font-bold text-stone-400">Table</p>
                  <p className="font-black text-stone-800">
                    {order.tableNumber ? `Table ${order.tableNumber}` : `Table ${order.tableSession.table.tableNumber}`}
                  </p>
                </div>
              )}
              {(order.waiterName || order.tableSession?.waiter?.user?.fullName || order.tableSession?.waiterName) && (
                <div>
                  <p className="text-xs font-bold text-stone-400">Assigned Waiter / Server</p>
                  <p className="font-bold text-stone-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>{order.waiterName || order.tableSession?.waiter?.user?.fullName || order.tableSession?.waiterName}</span>
                    {(order.waiterCode || order.tableSession?.waiter?.employeeCode) && (
                      <span className="text-xs text-stone-500 font-mono">({order.waiterCode || order.tableSession?.waiter?.employeeCode})</span>
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-stone-400">Total Amount</p>
                <p className="font-black text-lg text-primary">
                  Rs. {Number(order.totalAmount).toFixed(2)}
                </p>
                {Number(order.deliveryCharge || 0) > 0 && (
                  <p className="text-[11px] text-stone-500 font-medium">
                    (Includes Rs. {Number(order.deliveryCharge).toFixed(0)} delivery fee)
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400">Payment Method</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-bold text-stone-800 capitalize">
                    {order.paymentMethod === "qr" || order.paymentMethod === "fonepay_qr"
                      ? "FonePay QR / Online"
                      : "Cash on Delivery"}
                  </span>
                  {order.txRef && (
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Tx: {order.txRef}
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-1">
                <PaymentStatusToggle
                  orderId={order._id?.toString() || order.id?.toString()}
                  currentPaymentStatus={order.paymentStatus as "pending" | "paid"}
                  disabled={isCancelled}
                  onStatusChange={(newStatus) =>
                    setOrder((prev: any) =>
                      prev ? { ...prev, paymentStatus: newStatus } : prev
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Details & Navigation Map */}
        {order.orderType === "delivery" ? (
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-stone-200/90 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Delivery Info & Navigation
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Delivery Location
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400">Customer Delivery Address</p>
                <p className="font-extrabold text-stone-900 text-sm mt-0.5 leading-snug">
                  {cleanAddressText(order.address)}
                </p>
              </div>

              <StaticMapView address={order.address || ""} />
            </div>

            {order.notes && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-400">Order & Delivery Notes</p>
                <p className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3 rounded-xl mt-1 border border-stone-200/80 italic">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="col-span-1 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-stone-200/90 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" /> Store Fulfillment
              </h2>
              <div className="bg-orange-50 text-orange-700 p-4 rounded-xl font-bold text-sm text-center mt-4 border border-orange-200">
                Dine-in / Pickup Order. Customer will pick up at store or dine at assigned table.
              </div>
            </div>

            {order.notes && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-400">Order Notes</p>
                <p className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3 rounded-xl mt-1 border border-stone-200/80 italic">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
        <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 font-bold text-stone-500 text-sm rounded-l-lg">Product</th>
                <th className="p-3 font-bold text-stone-500 text-sm">Size / Variant</th>
                <th className="p-3 font-bold text-stone-500 text-sm">Qty</th>
                <th className="p-3 font-bold text-stone-500 text-sm">Unit Price</th>
                <th className="p-3 font-bold text-stone-500 text-sm rounded-r-lg text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(order.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="p-3 font-bold text-stone-900">{item.productName}</td>
                  <td className="p-3 text-stone-600 font-medium">
                    {item.selectedWeightInGrams
                      ? item.selectedWeightInGrams >= 1000
                        ? `${item.selectedWeightInGrams / 1000}kg`
                        : `${item.selectedWeightInGrams}g`
                      : item.selectedVariantName || "-"}
                  </td>
                  <td className="p-3 font-black text-stone-900">x{item.qty}</td>
                  <td className="p-3 text-stone-500">
                    {item.pricePerKgAtTimeOfOrder
                      ? `Rs. ${item.pricePerKgAtTimeOfOrder}/kg`
                      : item.unitPriceAtTimeOfOrder
                      ? `Rs. ${item.unitPriceAtTimeOfOrder}`
                      : "-"}
                  </td>
                  <td className="p-3 font-black text-stone-900 text-right">
                    Rs. {Number(item.calculatedPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200">
                <td colSpan={4} className="pt-4 px-3 text-right font-bold text-stone-500">
                  Subtotal
                </td>
                <td className="pt-4 px-3 text-right font-bold text-stone-900">
                  Rs. {(order.subtotalAmount !== undefined ? Number(order.subtotalAmount) : (order.items || []).reduce((acc: number, item: any) => acc + Number(item.calculatedPrice || 0), 0)).toFixed(2)}
                </td>
              </tr>
              {order.orderType === "delivery" && (
                <tr>
                  <td colSpan={4} className="py-1 px-3 text-right font-bold text-stone-500">
                    Delivery Charge{" "}
                    {Number(order.deliveryCharge || 0) === 0
                      ? (order.subtotalAmount !== undefined ? Number(order.subtotalAmount) : Number(order.totalAmount)) >= 500
                        ? "(Free Delivery ≥ Rs. 500)"
                        : "(Free / Waived)"
                      : "(Standard Fee < Rs. 500)"}
                  </td>
                  <td className="py-1 px-3 text-right font-bold text-stone-900">
                    {Number(order.deliveryCharge || 0) > 0 ? (
                      `+ Rs. ${Number(order.deliveryCharge).toFixed(2)}`
                    ) : (
                      <span className="text-emerald-600 font-black">Free</span>
                    )}
                  </td>
                </tr>
              )}
              {order.orderType === "pickup" && (
                <tr>
                  <td colSpan={4} className="py-1 px-3 text-right font-bold text-stone-500">
                    Order Type
                  </td>
                  <td className="py-1 px-3 text-right font-bold text-stone-700">
                    Self Pickup (No Delivery Fee)
                  </td>
                </tr>
              )}
              {Number(order.discountAmount || 0) > 0 && (
                <tr>
                  <td colSpan={4} className="py-1 px-3 text-right font-bold text-red-600">
                    Discount
                  </td>
                  <td className="py-1 px-3 text-right font-bold text-red-600">
                    - Rs. {Number(order.discountAmount).toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-stone-200">
                <td colSpan={4} className="p-4 text-right font-black text-base text-stone-700">
                  Grand Total
                </td>
                <td className="p-4 text-right font-black text-xl text-primary">
                  Rs. {Number(order.totalAmount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 80mm Thermal Receipt / Tax Invoice Modal */}
      <ThermalReceiptModal
        order={order}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
