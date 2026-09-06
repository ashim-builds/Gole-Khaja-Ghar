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
      className={`sticky top-0 z-50 w-full flex flex-col items-center pointer-events-none transition-all duration-500 ease-out ${
        scrolled ? "px-2 sm:px-4 lg:px-6" : "px-0"
      }`}
    >
      {/* 
        Navbar Container:
        - At top: 100% full width, edge-to-edge with bottom border.
        - When scrolled: smooth transform into floating Apple-style compact blur capsule.
      */}
      <nav
        className={`pointer-events-auto relative w-full flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "max-w-5xl my-2 sm:my-2.5 h-14 sm:h-15 px-3.5 sm:px-6 rounded-full bg-[#0c0a09]/85 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
            : "max-w-none my-0 h-16 sm:h-20 px-4 sm:px-6 lg:px-8 rounded-none bg-[#111111]/95 backdrop-blur-md border-b border-[#222222] shadow-none ring-0"
        }`}
      >
        {/* Subtle Ambient Radial Glow only when in floating capsule mode */}
        {scrolled && (
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 blur-xl pointer-events-none" />
        )}

        {/* Brand Logo */}
        <div className="shrink-0 flex items-center">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 sm:gap-2.5 group">
            <div
              className={`relative rounded-full overflow-hidden border border-primary/40 bg-stone-900 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-all duration-300 ${
                scrolled ? "w-8 h-8 sm:w-9 sm:h-9" : "w-8 h-8 sm:w-10 sm:h-10"
              }`}
            >
              <img src="/images/logo.png" alt="Gole Khaja Ghar Logo" className="w-full h-full object-cover" />
            </div>
            <span
              className={`font-extrabold tracking-tight text-white whitespace-nowrap transition-all duration-300 ${
                scrolled ? "text-sm sm:text-lg lg:text-xl" : "text-base sm:text-xl lg:text-2xl"
              }`}
            >
              Gole <span className="text-primary">Khaja Ghar</span>
            </span>
          </Link>
        </div>

        {/* Desktop Center Navigation (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-5 xl:gap-8">
          <div className="flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={link.onClick}
                className={`relative font-semibold whitespace-nowrap py-1 transition-colors duration-200 group ${
                  scrolled ? "text-xs xl:text-sm" : "text-sm xl:text-base"
                } ${isActive(link.href) ? "text-primary font-bold" : "text-stone-300 hover:text-primary"}`}
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
          <div className="flex items-center gap-2.5 xl:gap-3.5 border-l border-white/10 pl-3.5 xl:pl-5 shrink-0">
            {/* Admin or Staff prominent action button */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-orange-400/40 shadow-lg shadow-orange-600/25 tracking-wide group active:scale-95 duration-200"
                title="Open Admin Control Panel"
              >
                <LayoutDashboard className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-200" />
                <span>Admin Dashboard</span>
              </Link>
            ) : isWaiterOrCashier ? (
              <Link
                to="/pos"
                className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-emerald-400/40 shadow-lg shadow-emerald-600/25 tracking-wide group active:scale-95 duration-200"
                title="Open POS Terminal"
              >
                <Store className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200" />
                <span>Dine-In POS</span>
              </Link>
            ) : isKitchen ? (
              <Link
                to="/kitchen"
                className="flex items-center gap-2 text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-amber-400/40 shadow-lg shadow-amber-600/25 tracking-wide group active:scale-95 duration-200"
                title="Open Kitchen Display System"
              >
                <ChefHat className="w-4 h-4 text-white group-hover:rotate-6 transition-transform duration-200" />
                <span>Kitchen KDS</span>
              </Link>
            ) : (
              <a
                href="tel:+9779846011810"
                className="flex items-center gap-2 text-white hover:text-primary transition-colors duration-200 text-xs xl:text-sm font-bold bg-white/5 hover:bg-white/10 px-3.5 py-1.5 sm:py-2 rounded-full border border-white/10 active:scale-95"
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
        <div className="lg:hidden flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell type="customer" />

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative p-2 text-white hover:text-orange-500 transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center shrink-0 active:scale-95"
            aria-label="View Cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-white bg-orange-600 rounded-full shadow-md border border-black">
                {totalItems}
              </span>
            )}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="text-white hover:text-orange-400 p-2 focus:outline-none rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Animated Glassmorphism Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto lg:hidden overflow-hidden w-full ${
              scrolled ? "max-w-5xl mt-2 px-2" : "max-w-none mt-0"
            }`}
          >
            <div
              className={`p-4 space-y-3 bg-[#111111]/95 backdrop-blur-2xl border-white/10 shadow-2xl ${
                scrolled
                  ? "rounded-3xl border ring-1 ring-white/10"
                  : "rounded-none border-b border-[#222222]"
              }`}
            >
              {/* If Admin or Staff, show sleek Quick Switcher */}
              {(isAdmin || isWaiterOrCashier || isKitchen) && (
                <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 mb-2 shadow-sm">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Staff Quick Access
                    </span>
                    <span className="text-[9px] bg-stone-800 text-stone-300 font-bold px-2 py-0.5 rounded-full border border-stone-700">
                      {role}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] text-center shadow-md active:scale-95 transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 mb-1" />
                      <span>Admin</span>
                    </Link>
                    <Link
                      to="/pos"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 font-bold text-[11px] text-center border border-stone-700 active:scale-95 transition-all"
                    >
                      <Store className="w-4 h-4 mb-1 text-emerald-400" />
                      <span>POS</span>
                    </Link>
                    <Link
                      to="/kitchen"
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] text-center border border-stone-700 active:scale-95 transition-all"
                    >
                      <ChefHat className="w-4 h-4 mb-1 text-amber-400" />
                      <span>Kitchen</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? "bg-orange-600/20 text-orange-400 border border-orange-500/40"
                          : "text-stone-200 hover:bg-white/5 active:bg-white/10"
                      }`}
                      onClick={() => {
                        setIsOpen(false);
                        if (link.onClick) link.onClick();
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        {link.icon && <link.icon className="w-4 h-4 text-stone-400" />}
                        {link.name}
                      </span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Quick Call */}
              <div className="pt-2 border-t border-stone-800/80">
                <a
                  href="tel:+9779846011810"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-stone-300 font-bold text-xs bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
                  <span>Call Us: +977 984-6011810</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
