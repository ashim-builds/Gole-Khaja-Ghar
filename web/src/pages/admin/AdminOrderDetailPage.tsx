import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, Package, Phone, Loader2, Printer, Receipt } from "lucide-react";
import StatusUpdater from "@/components/admin/StatusUpdater";
import PaymentStatusToggle from "@/components/admin/PaymentStatusToggle";
import StaticMapView from "@/components/StaticMapView";
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 bg-white rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>80mm Tax Invoice</span>
          </button>
          <StatusUpdater orderId={order._id?.toString() || order.id?.toString()} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Customer Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-stone-400">Name</p>
              <p className="font-bold text-stone-800">{order.customerInfo?.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400">Phone</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-stone-800">{order.customerInfo?.phone}</p>
                <a
                  href={`tel:${order.customerInfo?.phone}`}
                  className="text-primary hover:underline text-sm font-bold"
                >
                  Call
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Order Info
          </h2>
          <div className="space-y-3">
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
              <div className="flex items-center gap-2 mt-0.5">
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
            <div>
              <PaymentStatusToggle
                orderId={order._id?.toString() || order.id?.toString()}
                currentPaymentStatus={order.paymentStatus as "pending" | "paid"}
                onStatusChange={(newStatus) => setOrder((prev: any) => ({ ...prev, paymentStatus: newStatus }))}
              />
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Delivery Info
          </h2>
          <div className="space-y-3">
            {order.orderType === "delivery" ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-stone-400">Address</p>
                  <p className="font-bold text-stone-800">{order.address}</p>
                </div>
                <StaticMapView address={order.address || ""} />
              </div>
            ) : (
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg font-bold text-sm text-center">
                Customer will pick up at store.
              </div>
            )}

            {order.notes && (
              <div>
                <p className="text-xs font-bold text-stone-400 mt-4">Order Notes</p>
                <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg mt-1 italic">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
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
                    Delivery Charge {Number(order.deliveryCharge || 0) === 0 ? "(Free Delivery ≥ Rs. 100)" : ""}
                  </td>
                  <td className="py-1 px-3 text-right font-bold text-stone-900">
                    {Number(order.deliveryCharge || 0) > 0 ? `+ Rs. ${Number(order.deliveryCharge).toFixed(2)}` : "Free"}
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
