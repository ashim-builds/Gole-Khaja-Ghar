import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, LogOut, Package, Loader2, Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { checkPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/pushManager";

export default function AccountPage() {
  const { user, isLoading, logout } = useUser();
  const navigate = useNavigate();

  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  }>({
    supported: true,
    permission: "default",
    isSubscribed: false,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState("");

  const refreshPushStatus = async () => {
    const status = await checkPushSubscription();
    setPushStatus(status);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    refreshPushStatus();
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushError("");
    try {
      await subscribeToPush("customer");
      await refreshPushStatus();
    } catch (err: any) {
      console.error("Enable push error:", err);
      setPushError(err.message || "Failed to enable notifications.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    setPushError("");
    try {
      await unsubscribeFromPush();
      await refreshPushStatus();
    } catch (err: any) {
      console.error("Disable push error:", err);
      setPushError(err.message || "Failed to disable notifications.");
    } finally {
      setPushLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-black mb-8">My Account</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{user.name}</h2>
                <p className="text-stone-500 capitalize">{user.role || "Customer"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-100">
                <Mail className="w-5 h-5 text-stone-400" />
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Email</p>
                  <p className="text-black font-medium">{user.email || "—"}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <Phone className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Phone</p>
                    <p className="text-black font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Setting Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden mb-6 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-primary">
                {pushStatus.isSubscribed ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6 text-stone-400" />}
              </div>
              <div>
                <h3 className="font-bold text-black text-lg">Order Notifications</h3>
                <p className="text-sm text-stone-500">Receive live push alerts when your order is confirmed, cooking, or out for delivery</p>
              </div>
            </div>
          </div>

          {pushError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pushError}</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">Status:</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                pushStatus.isSubscribed
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : pushStatus.permission === "denied"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-stone-100 text-stone-700"
              }`}>
                {pushStatus.isSubscribed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Allowed & Active
                  </>
                ) : pushStatus.permission === "denied" ? (
                  "Blocked in Browser"
                ) : (
                  "Disallowed / Disabled"
                )}
              </span>
            </div>

            {pushStatus.isSubscribed ? (
              <button
                disabled={pushLoading}
                onClick={handleDisablePush}
                className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-200 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                Disallow Notifications
              </button>
            ) : (
              <button
                disabled={pushLoading}
                onClick={handleEnablePush}
                className="px-4 py-2.5 bg-orange-600 text-white font-black text-xs rounded-xl hover:bg-orange-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-600/20 uppercase tracking-wider"
              >
                {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Bell className="w-3.5 h-3.5 text-white" />}
                Allow Notifications
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4 hover:border-primary transition-colors group"
          >
            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Package className="w-6 h-6 text-stone-600 group-hover:text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-black">My Orders</h3>
              <p className="text-sm text-stone-500">View your order history</p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4 hover:border-red-500 transition-colors group text-left cursor-pointer"
          >
            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center group-hover:bg-red-50 transition-colors">
              <LogOut className="w-6 h-6 text-stone-600 group-hover:text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-black group-hover:text-red-600">Logout</h3>
              <p className="text-sm text-stone-500">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
