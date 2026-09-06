import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingCart, FileText, User, UtensilsCrossed, ChefHat } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";

export default function BottomNav() {
  const { totalItems, openCart } = useCart();
  const { user } = useUser();
  const location = useLocation();
  const pathname = location.pathname;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const userRole = (user?.role || "").toUpperCase();
  const isWaiter = userRole === "WAITER" || userRole === "CASHIER";
  const isKitchen = userRole === "KITCHEN" || userRole === "CHEF";
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-lg border-t border-white/10 z-50 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex justify-around items-center px-2 pt-2.5">
        <Link
          to="/"
          onClick={scrollToTop}
          className="flex flex-col items-center gap-1 group py-1 px-2.5"
        >
          <Home
            className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
          />
          <span
            className={`text-[11px] font-bold ${isActive("/") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
          >
            Home
          </span>
        </Link>
        <Link
          to="/shop"
          className="flex flex-col items-center gap-1 group py-1 px-2.5"
        >
          <Store
            className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/shop") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
          />
          <span
            className={`text-[11px] font-bold ${isActive("/shop") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
          >
            Menu
          </span>
        </Link>
        <button
          onClick={openCart}
          className="flex flex-col items-center gap-1 group py-1 px-2.5 relative outline-none cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-white/60 group-hover:text-primary transition-transform group-active:scale-90" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-primary text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-white/60 group-hover:text-primary transition-colors">
            Cart
          </span>
        </button>

        {isWaiter && (
          <Link
            to="/pos"
            className="flex flex-col items-center gap-1 group py-1 px-2.5"
          >
            <UtensilsCrossed
              className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/pos") ? "text-primary" : "text-orange-400 group-hover:text-primary"}`}
            />
            <span
              className={`text-[11px] font-bold ${isActive("/pos") ? "text-primary" : "text-orange-400 group-hover:text-primary"}`}
            >
              POS
            </span>
          </Link>
        )}

        {isKitchen && (
          <Link
            to="/kitchen"
            className="flex flex-col items-center gap-1 group py-1 px-2.5"
          >
            <ChefHat
              className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/kitchen") ? "text-primary" : "text-amber-400 group-hover:text-primary"}`}
            />
            <span
              className={`text-[11px] font-bold ${isActive("/kitchen") ? "text-primary" : "text-amber-400 group-hover:text-primary"}`}
            >
              Kitchen
            </span>
          </Link>
        )}

        {user ? (
          <>
            {!isWaiter && !isKitchen && (
              <Link
                to="/orders"
                className="flex flex-col items-center gap-1 group py-1 px-2.5"
              >
                <FileText
                  className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/orders") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
                />
                <span
                  className={`text-[11px] font-bold ${isActive("/orders") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
                >
                  Orders
                </span>
              </Link>
            )}
            <Link
              to="/account"
              className="flex flex-col items-center gap-1 group py-1 px-2.5"
            >
              <User
                className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/account") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
              />
              <span
                className={`text-[11px] font-bold ${isActive("/account") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
              >
                Account
              </span>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center gap-1 group py-1 px-2.5"
          >
            <User
              className={`w-5 h-5 transition-transform group-active:scale-90 ${isActive("/login") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
            />
            <span
              className={`text-[11px] font-bold ${isActive("/login") ? "text-primary" : "text-white/60 group-hover:text-primary"}`}
            >
              Login
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
