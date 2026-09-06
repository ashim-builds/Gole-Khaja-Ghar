import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { ChevronLeft, MapPin, Phone, User, Package, Loader2 } from "lucide-react";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate(`/login?from=/orders/${orderId || ""}`);
      return;
    }

    if (!orderId) return;

    let isMounted = true;
    setLoading(true);

    api.orders
      .getStatus(orderId)
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
  }, [orderId, user, userLoading, navigate]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-black text-stone-900 mb-2">Order Not Found</h1>
        <p className="text-stone-500 mb-6">{error || "We couldn't locate this order."}</p>
        <Link
          to="/orders"
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow hover:opacity-90"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/orders"
          className="inline-flex items-center text-stone-500 hover:text-black mb-6 transition-colors font-medium text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            Order <span className="text-primary">{order.orderNumber}</span>
          </h1>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${
              order.status === "delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "cancelled"
                ? "bg-red-100 text-red-800"
                : order.status === "ready"
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
          <div className="p-5 sm:p-6 border-b border-stone-100">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-2 border-b border-stone-50 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-black">{item.productName}</p>
                    <p className="text-sm text-stone-500">
                      {item.priceType === "weight"
                        ? `${item.selectedWeightInGrams}g × ${item.qty}`
                        : `${item.selectedVariantName || ""} × ${item.qty}`}
                    </p>
                  </div>
                  <p className="font-bold text-black">Rs. {item.calculatedPrice}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>Rs. {order.totalAmount - (order.deliveryCharge || 0)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Charge</span>
                <span>Rs. {order.deliveryCharge || 0}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-black pt-2">
                <span>Total</span>
                <span>Rs. {order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </h2>
            <div className="space-y-3 text-stone-600">
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400" /> {order.customerInfo?.name}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400" /> {order.customerInfo?.phone}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Details
            </h2>
            <div className="space-y-3 text-stone-600">
              <p className="font-medium capitalize text-black">Type: {order.orderType}</p>
              {order.address && <p className="text-sm">{order.address}</p>}
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-stone-100 text-sm">
                  <span className="font-bold text-stone-700 block mb-1">Notes:</span>
                  {order.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
