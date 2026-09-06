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
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Core navigation links
  const navLinks: { name: string; href: string; icon?: React.ComponentType<{ className?: string }>; onClick?: () => void }[] = [
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
    <header className="sticky top-0 z-50 w-full flex flex-col items-center pointer-events-none select-none">
      {/* Dynamic Animated Blur Navigation Bar */}
      <motion.nav
        layout
        initial={false}
        animate={{
          y: scrolled ? 8 : 0,
          scale: scrolled ? 0.98 : 1,
          maxWidth: scrolled ? "1140px" : "100%",
          borderRadius: scrolled ? "9999px" : "0px",
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 28,
        }}
        className={`pointer-events-auto relative w-full transition-colors duration-500 ease-out ${
          scrolled
            ? "mx-auto px-3.5 sm:px-6 bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
            : "px-4 sm:px-6 lg:px-8 bg-[#111111]/95 backdrop-blur-md border-b border-[#222222]"
        }`}
      >
        {/* Subtle Ambient Glow Effect on Scroll */}
        {scrolled && (
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-orange-500/15 via-transparent to-amber-500/15 blur-xl pointer-events-none" />
        )}

        <div className={`mx-auto w-full ${scrolled ? "" : "max-w-7xl"}`}>
          <div
            className={`flex justify-between items-center gap-2 sm:gap-4 transition-all duration-300 ${
              scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
            }`}
          >
            {/* Brand Logo */}
            <div className="shrink-0 flex items-center">
              <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 sm:gap-2.5 group">
                <motion.div
                  layout
                  className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border border-primary/40 bg-stone-900 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform"
                >
                  <img src="/images/logo.png" alt="Gole Khaja Ghar Logo" className="w-full h-full object-cover" />
                </motion.div>
                <span className="font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight text-white whitespace-nowrap">
                  Gole <span className="text-primary">Khaja Ghar</span>
                </span>
              </Link>
            </div>

            {/* Desktop Center Navigation (>= 1024px) */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-8">
              <div className="flex items-center gap-3 xl:gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={link.onClick}
                    className={`relative font-semibold text-sm xl:text-base whitespace-nowrap transition-colors py-1 group ${
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
              <div className="flex items-center gap-2.5 xl:gap-3.5 border-l border-white/10 pl-3 xl:pl-5 shrink-0">
                {/* Admin or Staff prominent action button */}
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-orange-400/40 shadow-lg shadow-orange-600/25 tracking-wide group active:scale-95"
                    title="Open Admin Control Panel"
                  >
                    <LayoutDashboard className="w-4 h-4 text-white group-hover:rotate-6 transition-transform" />
                    <span>Admin Dashboard</span>
                  </Link>
                ) : isWaiterOrCashier ? (
                  <Link
                    to="/pos"
                    className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-emerald-400/40 shadow-lg shadow-emerald-600/25 tracking-wide group active:scale-95"
                    title="Open POS Terminal"
                  >
                    <Store className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>Dine-In POS</span>
                  </Link>
                ) : isKitchen ? (
                  <Link
                    to="/kitchen"
                    className="flex items-center gap-2 text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 transition-all text-xs xl:text-sm font-black px-3.5 py-1.5 sm:py-2 rounded-full border border-amber-400/40 shadow-lg shadow-amber-600/25 tracking-wide group active:scale-95"
                    title="Open Kitchen Display System"
                  >
                    <ChefHat className="w-4 h-4 text-white group-hover:rotate-6 transition-transform" />
                    <span>Kitchen KDS</span>
                  </Link>
                ) : (
                  <a
                    href="tel:+9779846011810"
                    className="flex items-center gap-2 text-white hover:text-primary transition-colors text-xs xl:text-sm font-bold bg-white/5 hover:bg-white/10 px-3.5 py-1.5 sm:py-2 rounded-full border border-white/10 active:scale-95"
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
                  className="relative p-2 text-white hover:text-primary transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center shrink-0 active:scale-95"
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
                  className="flex items-center gap-1 text-white bg-gradient-to-r from-orange-600 to-amber-600 px-2.5 py-1.5 rounded-full border border-orange-400/40 text-[11px] font-black shadow-md shadow-orange-600/20 active:scale-95"
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
                className="text-white hover:text-primary p-2 focus:outline-none rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center shrink-0 active:scale-95"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Animated Glassmorphism Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto lg:hidden overflow-hidden w-full transition-all duration-300 ${
              scrolled
                ? "max-w-6xl mt-2 px-2 sm:px-4"
                : "w-full"
            }`}
          >
            <div
              className={`p-4 space-y-3 ${
                scrolled
                  ? "bg-[#0c0a09]/95 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl ring-1 ring-white/10"
                  : "bg-[#111111]/95 backdrop-blur-xl border-b border-[#222222] shadow-xl"
              }`}
            >
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
                        : scrolled
                        ? "bg-white/5 border-white/10 text-stone-100 hover:bg-white/10"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-stone-100 hover:bg-[#252525]"
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
                    className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white font-bold transition-all border ${
                      scrolled
                        ? "bg-white/10 border-white/15 hover:bg-white/20"
                        : "bg-[#1f1f1f] border-[#333] hover:bg-[#2a2a2a]"
                    }`}
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
