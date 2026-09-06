import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, Package, Phone, Loader2 } from "lucide-react";
import StatusUpdater from "@/components/admin/StatusUpdater";
import PaymentStatusToggle from "@/components/admin/PaymentStatusToggle";
import StaticMapView from "@/components/StaticMapView";
import { api } from "@/lib/api";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 bg-white rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <h1 className="text-3xl font-black text-stone-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <StatusUpdater orderId={order._id?.toString() || order.id?.toString()} currentStatus={order.status} />
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
            <div>
              <p className="text-xs font-bold text-stone-400">Total Amount</p>
              <p className="font-black text-lg text-primary">
                Rs. {Number(order.totalAmount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400">Payment Method</p>
              <p className="font-bold text-stone-800 capitalize">
                {order.paymentMethod === "qr" ? "QR Scan & Pay" : "Cash on Delivery"}
              </p>
            </div>
            <div>
              <PaymentStatusToggle
                orderId={order._id?.toString() || order.id?.toString()}
                currentPaymentStatus={order.paymentStatus as "pending" | "paid"}
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
              <tr>
                <td colSpan={4} className="p-4 text-right font-bold text-stone-500">
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
    </div>
  );
}
