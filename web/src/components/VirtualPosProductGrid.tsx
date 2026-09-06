import React, { useRef, useMemo, useState, useEffect } from "react";
import { Product } from "@/lib/api";
import { Plus, UtensilsCrossed } from "lucide-react";

interface VirtualPosProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  isMobile?: boolean;
  className?: string;
}

export default function VirtualPosProductGrid({
  products,
  onProductClick,
  isMobile = false,
  className = "",
}: VirtualPosProductGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure container width for responsive column counts on desktop
  useEffect(() => {
    if (isMobile) return;
    const el = parentRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [isMobile]);

  // Determine column count
  const columnCount = useMemo(() => {
    if (isMobile) return 2;
    if (containerWidth < 520) return 2;
    if (containerWidth < 800) return 3;
    if (containerWidth < 1180) return 4;
    return 5;
  }, [isMobile, containerWidth]);

  // Split products into rows
  const rows = useMemo(() => {
    const r: Product[][] = [];
    for (let i = 0; i < products.length; i += columnCount) {
      r.push(products.slice(i, i + columnCount));
    }
    return r;
  }, [products, columnCount]);

  // High-performance virtual windowing
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    let frameId: number | null = null;
    const handleScroll = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
        setViewportHeight(el.clientHeight);
      });
    };

    setViewportHeight(el.clientHeight);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const estimatedRowHeight = isMobile ? 245 : 275;
  const totalHeight = rows.length * estimatedRowHeight;
  const overscan = 2; // Buffer rows above and below

  const startIndex = Math.max(0, Math.floor(scrollTop / estimatedRowHeight) - overscan);
  const endIndex = Math.min(
    rows.length - 1,
    Math.ceil((scrollTop + viewportHeight) / estimatedRowHeight) + overscan
  );

  const visibleRows = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (rows[i]) {
        items.push({
          index: i,
          top: i * estimatedRowHeight,
          items: rows[i],
        });
      }
    }
    return items;
  }, [startIndex, endIndex, rows, estimatedRowHeight]);

  const gridColsClass = useMemo(() => {
    if (isMobile) return "grid-cols-2";
    if (columnCount === 2) return "grid-cols-2";
    if (columnCount === 3) return "grid-cols-3";
    if (columnCount === 4) return "grid-cols-4";
    return "grid-cols-5";
  }, [isMobile, columnCount]);

  return (
    <div
      ref={parentRef}
      className={`flex-1 overflow-y-auto custom-scrollbar relative ${className}`}
    >
      {products.length === 0 ? (
        <div className="text-center py-20 text-stone-500 space-y-2">
          <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-700" />
          <p className="font-bold text-xs">No food items match filter</p>
        </div>
      ) : (
        <div
          style={{
            height: `${totalHeight}px`,
            position: "relative",
            width: "100%",
          }}
        >
          {visibleRows.map((virtualRow) => (
            <div
              key={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.top}px)`,
                height: `${estimatedRowHeight}px`,
              }}
              className={`grid ${gridColsClass} gap-2.5 sm:gap-3 p-1`}
            >
              {virtualRow.items.map((prod) => {
                const isWeight = prod.priceType === "weight";
                const hasVariants = prod.variants && prod.variants.length > 0;
                const firstVariant = hasVariants ? prod.variants![0] : null;

                const priceDisplay = isWeight
                  ? `Rs. ${prod.pricePerKg}/kg`
                  : firstVariant
                  ? `Rs. ${firstVariant.price}`
                  : `Rs. ${prod.pricePerKg || 0}`;

                const portionHint =
                  !isWeight && firstVariant
                    ? prod.variants!.length > 1
                      ? `${prod.variants!.length} sizes`
                      : ""
                    : "";

                return (
                  <div
                    key={prod.id}
                    onClick={() => onProductClick(prod)}
                    className="bg-stone-900/90 border border-stone-800 hover:border-orange-500/60 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all select-none shadow-md hover:shadow-xl active:scale-[0.98] group overflow-hidden h-[calc(100%-8px)]"
                  >
                    {/* Top: Image & Tag */}
                    <div>
                      <div className="aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-stone-800/90 relative mb-2 flex-shrink-0">
                        <img
                          src={prod.image || "/images/logo.png"}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith("/images/logo.png")) {
                              target.src = "/images/logo.png";
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isWeight ? (
                          <span className="absolute top-1.5 left-1.5 bg-orange-600/95 backdrop-blur-sm text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-md">
                            Weight
                          </span>
                        ) : prod.variants && prod.variants.length > 1 ? (
                          <span className="absolute top-1.5 left-1.5 bg-stone-950/90 backdrop-blur-sm text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg shadow-md">
                            {prod.variants.length} Sizes
                          </span>
                        ) : null}
                      </div>

                      {/* Title & Category */}
                      <h3 className="font-black text-xs sm:text-sm text-stone-100 line-clamp-2 leading-tight break-words min-h-[2rem]">
                        {prod.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-stone-400 truncate mt-0.5 font-medium">
                        {prod.category}
                      </p>
                    </div>

                    {/* Bottom Price & Add Action */}
                    <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-orange-400 truncate">
                          {priceDisplay}
                        </div>
                        {portionHint && (
                          <div className="text-[9px] text-stone-500 font-bold truncate">
                            ({portionHint})
                          </div>
                        )}
                      </div>

                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/25 transition-all flex-shrink-0 active:scale-90">
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
