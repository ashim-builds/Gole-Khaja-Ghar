import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingCart, FileText, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";

export default function BottomNav() {
  const { totalItems, openCart } = useCart();
  const { user } = useUser();
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#222222] z-50">
      <div className="flex justify-between items-center px-6 py-3">
        <Link to="/" className="flex flex-col items-center gap-1 group">
          <Home className={`w-5 h-5 ${isActive("/") ? "text-primary" : "text-white/50 group-hover:text-primary"}`} />
          <span className={`text-[10px] font-medium ${isActive("/") ? "text-primary" : "text-white/50 group-hover:text-primary"}`}>Home</span>
        </Link>
        <Link to="/shop" className="flex flex-col items-center gap-1 group">
          <Store className={`w-5 h-5 ${isActive("/shop") ? "text-primary" : "text-white/50 group-hover:text-primary"}`} />
          <span className={`text-[10px] font-medium ${isActive("/shop") ? "text-primary" : "text-white/50 group-hover:text-primary"}`}>Menu</span>
        </Link>
        <button onClick={openCart} className="flex flex-col items-center gap-1 group relative outline-none cursor-pointer">
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-black text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-white/50 group-hover:text-primary transition-colors">Cart</span>
        </button>
        {user ? (
          <>
            <Link to="/orders" className="flex flex-col items-center gap-1 group">
              <FileText className={`w-5 h-5 ${isActive("/orders") ? "text-primary" : "text-white/50 group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium ${isActive("/orders") ? "text-primary" : "text-white/50 group-hover:text-primary"}`}>Orders</span>
            </Link>
            <Link to="/account" className="flex flex-col items-center gap-1 group">
              <User className={`w-5 h-5 ${isActive("/account") ? "text-primary" : "text-white/50 group-hover:text-primary"}`} />
              <span className={`text-[10px] font-medium ${isActive("/account") ? "text-primary" : "text-white/50 group-hover:text-primary"}`}>Account</span>
            </Link>
          </>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 group">
            <User className={`w-5 h-5 ${isActive("/login") ? "text-primary" : "text-white/50 group-hover:text-primary"}`} />
            <span className={`text-[10px] font-medium ${isActive("/login") ? "text-primary" : "text-white/50 group-hover:text-primary"}`}>Login</span>
          </Link>
        )}
      </div>
    </div>
  );
}
