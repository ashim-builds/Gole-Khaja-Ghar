import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function AutoScrollNavigator() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0;

      setScrollY(currentScroll);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottomOrProducts = () => {
    const productsElement = document.getElementById("menu-grid") || document.getElementById("products-section");
    if (productsElement) {
      productsElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollBy({
        top: 600,
        behavior: "smooth",
      });
    }
  };

  // Only show on customer shop pages (not on admin / kitchen / POS)
  const isShopPage =
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/pos") &&
    !location.pathname.startsWith("/kitchen");

  if (!isShopPage) return null;

  const isScrolledDown = scrollY > 250;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence mode="wait">
        {isScrolledDown ? (
          <motion.button
            key="scroll-top"
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="pointer-events-auto relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-900/90 hover:bg-orange-600 text-white shadow-xl shadow-stone-950/20 backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer border border-stone-700/50 group"
            title="Auto scroll to top"
            aria-label="Auto scroll to top"
          >
            {/* Circular SVG Scroll Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-stone-700/40 fill-none stroke-[2.5]"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-orange-500 fill-none stroke-[2.5] transition-all duration-150"
                strokeDasharray="100"
                strokeDashoffset={100 - scrollProgress}
                strokeLinecap="round"
              />
            </svg>

            <ArrowUp className="w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-y-0.5" />
          </motion.button>
        ) : location.pathname === "/" || location.pathname === "/shop" ? (
          <motion.button
            key="scroll-down"
            type="button"
            onClick={scrollToBottomOrProducts}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 0.85, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            whileHover={{ scale: 1.08, opacity: 1, y: 2 }}
            whileTap={{ scale: 0.92 }}
            className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-orange-600 hover:text-white text-stone-700 text-xs font-black uppercase tracking-wider shadow-lg border border-stone-200 backdrop-blur-md transition-all cursor-pointer group"
            title="Scroll to menu products"
            aria-label="Scroll to menu products"
          >
            <span>Explore Menu</span>
            <ArrowDown className="w-3.5 h-3.5 text-orange-600 group-hover:text-white transition-transform duration-300 group-hover:translate-y-0.5 animate-bounce" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
