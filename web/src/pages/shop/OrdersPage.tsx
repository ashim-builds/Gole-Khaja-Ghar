import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Order } from "@/lib/api";
import { ChevronRight, Package, Calendar } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const res = await api.orders.getUserOrders();
        if (active && res.success) {
          setOrders(res.orders || []);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load orders.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Link to="/" className="mt-4 text-primary font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-black mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">No orders yet</h2>
            <p className="text-stone-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link
              to="/shop"
              className="inline-flex bg-primary text-black font-black uppercase text-sm tracking-wide px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link
                to={`/order/${order.orderNumber}`}
                key={order._id}
                className="block bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-stone-100 hover:border-primary transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-stone-100 text-stone-800 text-xs font-bold px-2 py-1 rounded mb-2">
                      {order.orderNumber}
                    </span>
                    <h3 className="font-bold text-black text-lg">Rs. {Number(order.totalAmount).toFixed(2)}</h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'ready'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-stone-500 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 font-medium group-hover:text-primary transition-colors">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
