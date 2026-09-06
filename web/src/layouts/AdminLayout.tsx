import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Users,
  Settings,
  Store,
  ExternalLink,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Grid,
  TrendingUp,
} from "lucide-react";
import { AdminLiveProvider, useAdminLive } from "@/context/AdminLiveContext";
import AdminPushSetup from "@/components/AdminPushSetup";
import NotificationBell from "@/components/NotificationBell";
import { api } from "@/lib/api";

function AdminProtectedLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [moreOpen, setMoreOpen] = useState(false);
  const { newOrderNotification, dismissNotification, stats } = useAdminLive();

  const handleLogout = async () => {
    try {
      await api.auth.adminLogout();
      navigate("/admin/login");
    } catch (err) {
      console.error("Admin logout failed", err);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Dine-In POS", href: "/pos", icon: UtensilsCrossed },
    { name: "Kitchen (KDS)", href: "/kitchen", icon: ChefHat },
    { name: "Tables", href: "/admin/tables", icon: Grid },
    { name: "Billing", href: "/admin/billing", icon: Receipt },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Staff", href: "/admin/waiters", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: TrendingUp },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden relative">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111] text-white relative z-20">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-stone-900 flex items-center justify-center">
              <img
                src="/images/logo.png"
                alt="Gole Khaja Ghar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-black text-white">
              Gole <span className="text-primary">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell type="admin" />
            {stats && stats.pendingOrders > 0 && (
              <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-black animate-pulse">
                {stats.pendingOrders}
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors relative text-sm ${
                  isActive
                    ? "bg-orange-600 text-white font-black shadow-md shadow-orange-600/30"
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
                {item.name === "Orders" && stats && stats.pendingOrders > 0 && (
                  <span className="absolute right-4 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                    {stats.pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-white/10 mt-4">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors border border-emerald-500/20 bg-emerald-500/5 text-sm"
            >
              <Store className="w-5 h-5 text-emerald-400" />
              Customer Site
              <ExternalLink className="w-3.5 h-3.5 ml-auto text-emerald-400/70" />
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-stone-400 hover:text-red-400 font-bold transition-colors rounded-xl hover:bg-white/5 cursor-pointer text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 bg-stone-50 pb-28 md:pb-8 custom-scrollbar">
          <Outlet />
        </main>

        {/* Mobile "More" Bottom Sheet Drawer */}
        {moreOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
              onClick={() => setMoreOpen(false)}
            />
            {/* Slide-Up Sheet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-white/15 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar overscroll-contain animate-in slide-in-from-bottom-6 duration-200">
              {/* Sheet Drag Handle & Header */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
                <div className="flex items-center justify-between w-full px-1">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    More Management Options
                  </h3>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2-Column Grid of More Admin Tools */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: "Kitchen (KDS)", href: "/kitchen", icon: ChefHat, color: "text-amber-400" },
                  { name: "Tables", href: "/admin/tables", icon: Grid, color: "text-emerald-400" },
                  { name: "Billing", href: "/admin/billing", icon: Receipt, color: "text-cyan-400" },
                  { name: "Staff", href: "/admin/waiters", icon: Users, color: "text-purple-400" },
                  { name: "Reports", href: "/admin/reports", icon: TrendingUp, color: "text-blue-400" },
                  { name: "Settings", href: "/admin/settings", icon: Settings, color: "text-stone-300" },
                ].map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all active:scale-95 ${
                        isActive
                          ? "bg-orange-600/20 border-orange-500 text-white shadow-md shadow-orange-600/20 ring-1 ring-orange-500/50"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-stone-200 hover:bg-white/10"
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mb-2 ${item.color}`} />
                      <span className="text-xs font-black">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Logout Action (No Store link as requested) */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2.5 w-full py-3 px-4 text-red-400 hover:text-red-300 font-black text-xs uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Admin Mobile Bottom Navigation */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-lg border-t border-white/10 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="flex justify-around items-center px-1 pt-2">
            {/* 1. Dashboard */}
            <Link
              to="/admin"
              className="flex flex-col items-center gap-1 group py-1 px-2"
            >
              <LayoutDashboard
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  pathname === "/admin" ? "text-orange-500 font-bold" : "text-white/60 group-hover:text-orange-500"
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  pathname === "/admin" ? "text-orange-500" : "text-white/60 group-hover:text-orange-500"
                }`}
              >
                Dashboard
              </span>
            </Link>

            {/* 2. Dine-In POS */}
            <Link
              to="/pos"
              className="flex flex-col items-center gap-1 group py-1 px-2"
            >
              <UtensilsCrossed
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  pathname.startsWith("/pos") ? "text-orange-500 font-bold" : "text-white/60 group-hover:text-orange-500"
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  pathname.startsWith("/pos") ? "text-orange-500" : "text-white/60 group-hover:text-orange-500"
                }`}
              >
                POS
              </span>
            </Link>

            {/* 3. Orders */}
            <Link
              to="/admin/orders"
              className="flex flex-col items-center gap-1 group py-1 px-2 relative"
            >
              <div className="relative">
                <ShoppingCart
                  className={`w-5 h-5 transition-transform group-active:scale-90 ${
                    pathname.startsWith("/admin/orders") ? "text-orange-500 font-bold" : "text-white/60 group-hover:text-orange-500"
                  }`}
                />
                {stats && stats.pendingOrders > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
                    {stats.pendingOrders}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-bold ${
                  pathname.startsWith("/admin/orders") ? "text-orange-500" : "text-white/60 group-hover:text-orange-500"
                }`}
              >
                Orders
              </span>
            </Link>

            {/* 4. Products */}
            <Link
              to="/admin/products"
              className="flex flex-col items-center gap-1 group py-1 px-2"
            >
              <Package
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  pathname.startsWith("/admin/products") ? "text-orange-500 font-bold" : "text-white/60 group-hover:text-orange-500"
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  pathname.startsWith("/admin/products") ? "text-orange-500" : "text-white/60 group-hover:text-orange-500"
                }`}
              >
                Products
              </span>
            </Link>

            {/* 5. More (Bottom Drawer Trigger) */}
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex flex-col items-center gap-1 group py-1 px-2 cursor-pointer"
            >
              <Menu
                className={`w-5 h-5 transition-transform group-active:scale-90 ${
                  moreOpen ||
                  pathname.startsWith("/kitchen") ||
                  pathname.startsWith("/admin/tables") ||
                  pathname.startsWith("/admin/billing") ||
                  pathname.startsWith("/admin/waiters") ||
                  pathname.startsWith("/admin/reports") ||
                  pathname.startsWith("/admin/settings")
                    ? "text-orange-500 font-bold"
                    : "text-white/60 group-hover:text-orange-500"
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  moreOpen ||
                  pathname.startsWith("/kitchen") ||
                  pathname.startsWith("/admin/tables") ||
                  pathname.startsWith("/admin/billing") ||
                  pathname.startsWith("/admin/waiters") ||
                  pathname.startsWith("/admin/reports") ||
                  pathname.startsWith("/admin/settings")
                    ? "text-orange-500"
                    : "text-white/60 group-hover:text-orange-500"
                }`}
              >
                More
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Global New Order Alert Toast */}
      {newOrderNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] text-white p-5 rounded-2xl shadow-2xl border border-primary/30 max-w-sm w-full animate-bounce">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="font-black text-sm uppercase tracking-wider text-primary">
                New Order Received!
              </span>
            </div>
            <button
              onClick={dismissNotification}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-sm">
            <p className="font-bold text-white">
              Order #{newOrderNotification.orderNumber}
            </p>
            <p className="text-xs text-stone-300">
              Customer: {newOrderNotification.customerName}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Amount: Rs. {newOrderNotification.amount.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Link
              to="/admin/orders"
              onClick={dismissNotification}
              className="flex-1 text-center py-2.5 bg-orange-600 text-white font-black text-xs uppercase rounded-lg hover:bg-orange-500 transition-all cursor-pointer"
            >
              View Orders
            </Link>
            <button
              onClick={dismissNotification}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-lg transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <AdminPushSetup />
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminLiveProvider>
      <AdminProtectedLayoutContent />
    </AdminLiveProvider>
  );
}
