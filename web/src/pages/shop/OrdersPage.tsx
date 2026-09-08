import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, Order } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { ChevronRight, Package, Calendar, User, ArrowRight, AlertCircle, RefreshCw, Home } from "lucide-react";

export default function OrdersPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isAuthError?: boolean } | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.orders.getUserOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err: any) {
      const isAuth =
        err?.status === 401 ||
        (err?.message && (err.message.includes("Unauthorized") || err.message.includes("token")));
      setError({
        message: err?.message || "Failed to load orders.",
        isAuthError: isAuth,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      loadOrders();
    } else if (!isUserLoading && !user) {
      setLoading(false);
    }
  }, [user, isUserLoading]);

  if (isUserLoading || loading) {
    return (
      <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || error?.isAuthError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-stone-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Login Required to View Orders</h2>
            <p className="text-sm text-stone-600 font-medium leading-relaxed">
              Please sign in to your Gole Khaja Ghar account to view your order history and live order updates.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/login?redirect=/orders")}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Log In / Register
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-stone-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Unable to Load Orders</h2>
            <p className="text-sm text-stone-600 font-medium leading-relaxed">{error.message}</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={loadOrders}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              to="/"
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
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
              className="inline-flex bg-orange-600 text-white font-black uppercase text-sm tracking-wider px-6 py-3.5 rounded-xl hover:bg-orange-500 transition-all shadow-md shadow-orange-600/20"
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
