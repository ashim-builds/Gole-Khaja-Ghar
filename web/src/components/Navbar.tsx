import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, Phone } from "lucide-react";
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks: { name: string; href: string; onClick?: () => void }[] = [
    { name: "Home", href: "/", onClick: scrollToTop },
    { name: "Menu", href: "/shop" },
  ];

  if (user) {
    const role = (user.role || "").toUpperCase();
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      navLinks.push({ name: "Admin Dashboard", href: "/admin" });
      navLinks.push({ name: "Dine-In POS", href: "/pos" });
      navLinks.push({ name: "Billing", href: "/billing" });
    } else if (role === "WAITER" || role === "CASHIER") {
      navLinks.push({ name: "Dine-In POS", href: "/pos" });
      navLinks.push({ name: "Billing", href: "/billing" });
    } else if (role === "KITCHEN" || role === "CHEF") {
      navLinks.push({ name: "Kitchen Screen (KDS)", href: "/kitchen" });
    }
    navLinks.push(
      { name: "My Orders", href: "/orders" },
      { name: "Account", href: "/account" }
    );
  } else {
    navLinks.push({ name: "Login", href: "/login" });
  }

  return (
    <div
      className={`sticky top-0 z-50 w-full flex flex-col items-center transition-all duration-300 ${
        scrolled ? "px-2 sm:px-4 pointer-events-none" : "px-0"
      }`}
    >
      <nav
        className={`w-full transition-all duration-300 ease-in-out ${
          scrolled
            ? "max-w-6xl my-2 bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl rounded-full px-4 sm:px-6 pointer-events-auto"
            : "bg-[#111111] border-b border-[#222222] px-4 sm:px-6 lg:px-8"
        }`}
      >
        <div className={`mx-auto w-full ${scrolled ? "" : "max-w-7xl"}`}>
          <div
            className={`flex justify-between items-center gap-4 transition-all duration-300 ${
              scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
            }`}
          >
            {/* Logo */}
            <div className="shrink-0 flex items-center">
              <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 relative rounded-full overflow-hidden border border-primary/30 bg-stone-900 flex items-center justify-center shrink-0">
                  <img src="/images/logo.png" alt="Gole Khaja Ghar Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold text-lg sm:text-xl lg:text-2xl tracking-tight text-white whitespace-nowrap">
                  Gole <span className="text-primary">Khaja Ghar</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (>= 1024px) */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-8">
              <div className="flex items-center gap-4 xl:gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={link.onClick}
                    className={`relative font-semibold text-sm xl:text-base whitespace-nowrap transition-colors py-1 group ${
                      isActive(link.href) ? "text-primary font-bold" : "text-stone-200 hover:text-primary"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                        isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    ></span>
                  </Link>
                ))}
              </div>

              {/* Right Side Desktop Actions */}
              <div className="flex items-center gap-3 xl:gap-4 border-l border-white/10 pl-4 xl:pl-6 shrink-0">
                <a
                  href="tel:+9779865311559"
                  className="hidden xl:flex items-center gap-2 text-white hover:text-primary transition-colors text-sm font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Order Now</span>
                </a>

                {/* Customer push notifications bell */}
                <NotificationBell type="customer" />

                {/* Cart Button */}
                <button
                  onClick={openCart}
                  className="relative p-2 text-white hover:text-primary transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center"
                  aria-label="View Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
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
              <NotificationBell type="customer" />

              <button
                onClick={openCart}
                className="relative p-2 text-white hover:text-primary transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/10 flex items-center justify-center"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-white bg-orange-600 rounded-full shadow-md border border-black">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={toggleMenu}
                className="text-white hover:text-primary p-2 focus:outline-none rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`lg:hidden overflow-hidden w-full ${
              scrolled
                ? "bg-black/95 backdrop-blur-2xl rounded-3xl mt-2 border border-white/15 shadow-2xl max-w-6xl pointer-events-auto"
                : "bg-[#111111] border-b border-[#222222] shadow-xl"
            }`}
          >
            <div className="px-4 pt-3 pb-5 space-y-2 sm:space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`block px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all border ${
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
                  {link.name}
                </Link>
              ))}
              <div className="pt-2">
                <a
                  href="tel:+9779865311559"
                  className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white font-bold transition-all border ${
                    scrolled
                      ? "bg-white/10 border-white/15 hover:bg-white/20"
                      : "bg-[#1f1f1f] border-[#333] hover:bg-[#2a2a2a]"
                  }`}
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>Call to Order (+977 9865311559)</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

