import React, { useState, useRef } from "react";
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
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const { newOrderNotification, dismissNotification, stats } = useAdminLive();

  const openMore = () => {
    setIsClosing(false);
    setDragY(0);
    setMoreOpen(true);
  };

  const closeMore = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setMoreOpen(false);
      setIsClosing(false);
      setDragY(0);
    }, 240);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15); // gentle resistance when pulling up
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 60) {
      closeMore();
    } else {
      setDragY(0);
    }
  };

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
              className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200 ease-out ${
                isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-fade-in"
              }`}
              onClick={closeMore}
            />
            {/* Slide-Up / Slide-Down Sheet with Touch Drag support */}
            <div
              className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 rounded-t-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto custom-scrollbar overscroll-contain select-none ${
                isDragging
                  ? "transition-none"
                  : "transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              } ${!isClosing && !isDragging && dragY === 0 ? "animate-in slide-in-from-bottom-6 duration-200" : ""}`}
              style={{
                transform: isClosing
                  ? "translateY(100%)"
                  : dragY > 0
                  ? `translateY(${dragY}px)`
                  : "translateY(0%)",
              }}
            >
              {/* Sheet Drag Handle & Header - Touch drag surface */}
              <div
                className="flex flex-col items-center mb-4 touch-pan-y cursor-grab active:cursor-grabbing select-none -mx-2 -mt-1 pt-1 pb-2"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-12 h-1.5 rounded-full bg-stone-300 hover:bg-stone-400 active:bg-stone-500 transition-colors mb-3" />
                <div className="flex items-center justify-between w-full px-3">
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                    More Management Options
                  </h3>
                  <button
                    type="button"
                    onClick={closeMore}
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2-Column Grid of More Admin Tools */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    name: "Kitchen (KDS)",
                    href: "/kitchen",
                    icon: ChefHat,
                    iconBg: "bg-amber-100 text-amber-700",
                    borderHover: "hover:border-amber-300 hover:bg-amber-50/40",
                  },
                  {
                    name: "Tables",
                    href: "/admin/tables",
                    icon: Grid,
                    iconBg: "bg-emerald-100 text-emerald-700",
                    borderHover: "hover:border-emerald-300 hover:bg-emerald-50/40",
                  },
                  {
                    name: "Billing",
                    href: "/admin/billing",
                    icon: Receipt,
                    iconBg: "bg-cyan-100 text-cyan-700",
                    borderHover: "hover:border-cyan-300 hover:bg-cyan-50/40",
                  },
                  {
                    name: "Staff",
                    href: "/admin/waiters",
                    icon: Users,
                    iconBg: "bg-purple-100 text-purple-700",
                    borderHover: "hover:border-purple-300 hover:bg-purple-50/40",
                  },
                  {
                    name: "Reports",
                    href: "/admin/reports",
                    icon: TrendingUp,
                    iconBg: "bg-blue-100 text-blue-700",
                    borderHover: "hover:border-blue-300 hover:bg-blue-50/40",
                  },
                  {
                    name: "Settings",
                    href: "/admin/settings",
                    icon: Settings,
                    iconBg: "bg-stone-200 text-stone-700",
                    borderHover: "hover:border-stone-400 hover:bg-stone-100/80",
                  },
                ].map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMore}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all active:scale-95 shadow-sm ${
                        isActive
                          ? "bg-orange-50 border-orange-500 text-orange-950 ring-1 ring-orange-500/40"
                          : `bg-stone-50/90 border-stone-200/90 text-stone-800 ${item.borderHover}`
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 shadow-xs ${item.iconBg}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-stone-900 tracking-tight">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Go to Customer Storefront Button */}
              <div className="pt-3">
                <Link
                  to="/"
                  onClick={closeMore}
                  className="flex items-center gap-3 p-3.5 rounded-2xl font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 transition-all active:scale-95 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/15 flex items-center justify-center text-emerald-700 flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-emerald-950">Customer Storefront</div>
                    <div className="text-[10px] text-emerald-700 font-medium truncate">View live customer ordering menu</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-700 ml-auto flex-shrink-0" />
                </Link>
              </div>

              {/* Logout Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeMore();
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 text-red-600 hover:text-red-700 font-black text-xs uppercase tracking-wider bg-red-50 hover:bg-red-100/90 border border-red-200/90 rounded-xl cursor-pointer transition-all active:scale-95"
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
              onClick={() => (moreOpen ? closeMore() : openMore())}
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
