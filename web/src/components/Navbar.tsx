import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingCart,
  Phone,
  LayoutDashboard,
  Store,
  ReceiptText,
  ChefHat,
  User,
  LogIn,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, openCart } = useCart();
  const { user } = useUser();
  const location = useLocation();
  const pathname = location.pathname;

  const role = (user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isWaiterOrCashier = role === "WAITER" || role === "CASHIER";
  const isKitchen = role === "KITCHEN" || role === "CHEF";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Core navigation links
  const navLinks: {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
  }[] = [
    { name: "Home", href: "/", onClick: scrollToTop },
    { name: "Menu", href: "/shop" },
  ];

  if (user) {
    navLinks.push({ name: "My Orders", href: "/orders", icon: ShoppingBag });
    navLinks.push({ name: "Account", href: "/account", icon: User });
  } else {
    navLinks.push({ name: "Login", href: "/login", icon: LogIn });
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled
          ? "bg-[#0c0a09]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.45)]"
          : "bg-[#111111]/95 backdrop-blur-md border-b border-[#222222]/80"
      }`}
    >
      {/* Top micro orange accent gradient line when scrolled */}
      <div
        className={`w-full h-[2px] bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex justify-between items-center gap-3 sm:gap-6 transition-all duration-300 ease-out ${
            scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
          }`}
        >
          {/* Brand Logo */}
          <div className="shrink-0 flex items-center">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border border-primary/40 bg-stone-900 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
                <img src="/images/logo.png" alt="Gole Khaja Ghar Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight text-white whitespace-nowrap">
                Gole <span className="text-primary">Khaja Ghar</span>
              </span>
            </Link>
          </div>

          {/* Desktop Center Navigation (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <div className="flex items-center gap-5 xl:gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={link.onClick}
                  className={`relative font-semibold text-sm xl:text-base whitespace-nowrap py-1 transition-colors duration-200 group ${
                    isActive(link.href) ? "text-primary font-bold" : "text-stone-300 hover:text-primary"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                      isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Right Side Desktop Actions */}
            <div className="flex items-center gap-3 xl:gap-4 border-l border-white/10 pl-4 xl:pl-6 shrink-0">
              {/* Admin or Staff prominent action button */}
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all text-xs xl:text-sm font-black px-3.5 py-2 rounded-full border border-orange-400/40 shadow-lg shadow-orange-600/25 tracking-wide group active:scale-95 duration-200"
                  title="Open Admin Control Panel"
                >
                  <LayoutDashboard className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-200" />
                  <span>Admin Dashboard</span>
                </Link>
              ) : isWaiterOrCashier ? (
                <Link
                  to="/pos"
                  className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all text-xs xl:text-sm font-black px-3.5 py-2 rounded-full border border-emerald-400/40 shadow-lg shadow-emerald-600/25 tracking-wide group active:scale-95 duration-200"
                  title="Open POS Terminal"
                >
                  <Store className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200" />
                  <span>Dine-In POS</span>
                </Link>
              ) : isKitchen ? (
                <Link
                  to="/kitchen"
                  className="flex items-center gap-2 text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 transition-all text-xs xl:text-sm font-black px-3.5 py-2 rounded-full border border-amber-400/40 shadow-lg shadow-amber-600/25 tracking-wide group active:scale-95 duration-200"
                  title="Open Kitchen Display System"
                >
                  <ChefHat className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-200" />
                  <span>Kitchen KDS</span>
                </Link>
              ) : (
                <a
                  href="tel:+9779846011810"
                  className="flex items-center gap-2 text-white hover:text-primary transition-colors duration-200 text-xs xl:text-sm font-bold bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-full border border-white/10 active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Order Now</span>
                </a>
              )}

              {/* Push Notification Bell */}
              <NotificationBell type="customer" />

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-2 text-white hover:text-primary transition-colors duration-200 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center shrink-0 active:scale-95"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-black leading-none text-white bg-orange-600 rounded-full shadow-md border-2 border-black animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile / Tablet Actions (< 1024px) */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
            {/* Quick Admin Icon Shortcut on mobile header */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-white bg-gradient-to-r from-orange-600 to-amber-600 px-2.5 py-1.5 rounded-full border border-orange-400/40 text-[11px] font-black shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                title="Admin Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Admin</span>
              </Link>
            )}

            <NotificationBell type="customer" />

            <button
              onClick={openCart}
              className="relative p-2 text-white hover:text-primary transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center shrink-0 active:scale-95"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-white bg-orange-600 rounded-full shadow-md border border-black">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={toggleMenu}
              className="text-white hover:text-primary p-2 focus:outline-none rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Animated Glassmorphism Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden w-full bg-[#0c0a09]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-3">
              {/* If Admin or Staff, show quick access hub */}
              {isAdmin && (
                <div className="bg-stone-900/90 border border-orange-500/30 rounded-2xl p-3 mb-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Admin Control Hub
                    </span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                      ADMIN
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs text-center shadow-md active:scale-95 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 mb-1" />
                      <span>Admin</span>
                    </Link>
                    <Link
                      to="/pos"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs text-center border border-white/10 active:scale-95 transition-all"
                    >
                      <Store className="w-4 h-4 mb-1 text-emerald-400" />
                      <span>POS</span>
                    </Link>
                    <Link
                      to="/billing"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs text-center border border-white/10 active:scale-95 transition-all"
                    >
                      <ReceiptText className="w-4 h-4 mb-1 text-cyan-400" />
                      <span>Billing</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* General Navigation Links */}
              <div className="space-y-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all border ${
                      isActive(link.href)
                        ? "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/30 font-black"
                        : "bg-white/5 border-white/10 text-stone-100 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setIsOpen(false);
                      if (link.onClick) link.onClick();
                    }}
                  >
                    <span>{link.name}</span>
                    {link.icon && <link.icon className="w-4 h-4 opacity-70" />}
                  </Link>
                ))}
              </div>

              {/* Action Button: Admin Portal or Phone Call */}
              <div className="pt-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl text-white font-black bg-gradient-to-r from-orange-600 to-amber-600 border border-orange-400/40 shadow-lg shadow-orange-600/30 active:scale-[0.98] transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Admin Dashboard</span>
                  </Link>
                ) : (
                  <a
                    href="tel:+9779846011810"
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white font-bold bg-white/10 border border-white/15 hover:bg-white/20 transition-all"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <span>Call to Order (+977 984-6011810)</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
