import { getImageUrl } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useStoreHours } from "@/lib/storeHours";
import { Plus, Check, Clock, Layers } from "lucide-react";

interface Variant {
  name: string;
  price: number;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  priceType?: "weight" | "variant";
  pricePerKg?: number;
  variants?: Variant[];
  image: string;
  category: string;
  isAvailable?: boolean;
  index?: number;
}

export default function ProductCard({
  id,
  slug,
  name,
  priceType = "variant",
  pricePerKg,
  variants = [],
  image,
  category,
  isAvailable = true,
  index = 0,
}: ProductCardProps) {
  const storeStatus = useStoreHours();
  const navigate = useNavigate();
  const [selectedWeight] = useState<number>(250);
  const [isAdded, setIsAdded] = useState(false);
  const { addWeightItem, addVariantItem } = useCart();

  const hasMultipleVariants = variants.length > 1;
  const firstVariant = variants.length > 0 ? variants[0] : null;

  // Calculate lowest / base price
  const displayPrice =
    priceType === "weight" && pricePerKg
      ? pricePerKg
      : variants.length > 0
      ? Math.min(...variants.map((v) => v.price))
      : pricePerKg || 0;

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!storeStatus.isOpen || !isAvailable) return;

    // If item has multiple variants or is weight-based with customization, navigate to product detail page to choose portion
    if (hasMultipleVariants || priceType === "weight") {
      navigate(`/product/${slug}`);
      return;
    }

    // Otherwise add directly
    const variantToUse = firstVariant || { name: "Regular", price: pricePerKg || 0 };
    addVariantItem(
      { id, slug, name, priceType: "variant", image },
      variantToUse.name,
      variantToUse.price,
      1
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const isDrink =
    category?.toLowerCase().includes("drink") ||
    category?.toLowerCase().includes("beverage") ||
    category?.toLowerCase().includes("beer") ||
    name.toLowerCase().includes("beer") ||
    name.toLowerCase().includes("vodka") ||
    name.toLowerCase().includes("rum") ||
    name.toLowerCase().includes("whisky") ||
    name.toLowerCase().includes("lassi") ||
    name.toLowerCase().includes("coke") ||
    name.toLowerCase().includes("fanta") ||
    name.toLowerCase().includes("sprite") ||
    name.toLowerCase().includes("juice");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.35),
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`bg-white md:rounded-2xl p-3.5 sm:p-4 flex flex-row md:flex-col justify-between hover:shadow-2xl hover:border-orange-200/80 transition-all duration-300 border-b md:border border-stone-100 last:border-b-0 gap-3 md:gap-3 h-full relative group ${
        !isAvailable ? "opacity-60" : ""
      }`}
    >
      {/* Mobile: Left Text Details | Desktop: Middle Text Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-1 md:pr-0 order-1 md:order-2">
        <div>
          {category && (
            <span className="text-[10px] sm:text-[11px] font-bold text-orange-600 uppercase tracking-wider block mb-1">
              {category}
            </span>
          )}
          <Link
            to={`/product/${slug}`}
            className="hover:text-orange-600 transition-colors block"
          >
            <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2">
              {name}
            </h3>
          </Link>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-black text-stone-950">
              Rs. {displayPrice}
            </span>
            {priceType === "weight" ? (
              <span className="text-stone-500 font-bold text-[11px]">/ kg</span>
            ) : hasMultipleVariants ? (
              <span className="text-stone-400 font-medium text-[11px]">onwards</span>
            ) : null}
          </div>

          {hasMultipleVariants && (
            <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200/80 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
              <Layers className="w-2.5 h-2.5 text-stone-500" />
              {variants.length} Portions
            </span>
          )}
        </div>
      </div>

      {/* Mobile: Right 3D Dish | Desktop: Top 3D Dish Container */}
      <div className="relative flex-shrink-0 order-2 md:order-1 w-24 sm:w-28 md:w-full flex justify-center py-2">
        <Link
          to={`/product/${slug}`}
          className="relative block group/dish cursor-pointer"
        >
          {/* 3D Under-Plate Ambient Cast Shadow */}
          <div className="absolute inset-x-2 -bottom-2 h-4 sm:h-5 bg-black/25 rounded-full blur-md group-hover/dish:bg-orange-600/30 group-hover/dish:blur-lg group-hover/dish:scale-110 transition-all duration-300 pointer-events-none" />

          {!isDrink ? (
            /* 3D Ceramic / Brass Serving Plate */
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full p-2 sm:p-2.5 bg-gradient-to-br from-stone-100 via-white to-stone-300 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.18)] border border-stone-200/80 ring-2 ring-stone-100 group-hover:ring-orange-500/40 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              {/* Inner Plate Cavity (Recessed Bowl Center) */}
              <div className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.35),0_1px_2px_rgba(255,255,255,0.9)] border border-stone-300/70 bg-stone-100">
                <img
                  src={getImageUrl(image)}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/images/logo.png")) {
                      target.src = "/images/logo.png";
                    }
                  }}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover/dish:scale-115 ${
                    !isAvailable ? "grayscale" : ""
                  }`}
                />

                {/* 3D Ceramic Gloss Glaze Reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none rounded-full" />
              </div>
            </div>
          ) : (
            /* 3D Beverage / Bottle Pedestal Coaster */
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full p-2 sm:p-2.5 bg-gradient-to-br from-amber-100 via-amber-50 to-stone-300 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.22)] border border-amber-300/80 ring-2 ring-amber-200/90 group-hover:ring-amber-500 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              {/* Inner Drink Coaster Mat */}
              <div className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.9)] border border-amber-200/80 bg-stone-900/5">
                <img
                  src={getImageUrl(image)}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/images/logo.png")) {
                      target.src = "/images/logo.png";
                    }
                  }}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover/dish:scale-115 ${
                    !isAvailable ? "grayscale" : ""
                  }`}
                />

                {/* 3D Drink Glassware Light Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/10 to-white/40 pointer-events-none rounded-full" />
              </div>
            </div>
          )}

          {!isAvailable && (
            <div className="absolute inset-0 bg-black/55 rounded-full flex items-center justify-center p-1 backdrop-blur-[1px]">
              <span className="text-[9px] sm:text-[10px] font-black text-white px-2 py-0.5 bg-red-600 rounded-full shadow uppercase tracking-wider text-center">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Floating Action Button (Overlapping Bottom Center of Image) */}
        <div className="md:hidden absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-[84%]">
          <button
            type="button"
            disabled={!storeStatus.isOpen || !isAvailable || isAdded}
            onClick={handleActionClick}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer ${
              !storeStatus.isOpen || !isAvailable
                ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                : isAdded
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 shadow-orange-600/15"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : !storeStatus.isOpen ? (
              <>
                <Clock className="w-3 h-3" />
                <span>Closed</span>
              </>
            ) : hasMultipleVariants || priceType === "weight" ? (
              <>
                <span>ADD</span>
                <Plus className="w-3 h-3 stroke-[3]" />
              </>
            ) : (
              <>
                <span>ADD</span>
                <Plus className="w-3 h-3 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Action Button (Bottom of Card) */}
      <div className="hidden md:block w-full order-3 pt-1">
        <button
          type="button"
          disabled={!storeStatus.isOpen || !isAvailable || isAdded}
          onClick={handleActionClick}
          className={`w-full h-10 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
            !storeStatus.isOpen || !isAvailable
              ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
              : isAdded
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 active:scale-[0.98]"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Cart</span>
            </>
          ) : !storeStatus.isOpen ? (
            <>
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Store Closed</span>
            </>
          ) : hasMultipleVariants ? (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>Select Portion</span>
            </>
          ) : priceType === "weight" ? (
            <>
              <span>Choose Weight</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
