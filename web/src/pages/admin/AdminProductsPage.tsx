import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Image as ImageIcon,
  Loader2,
  Package,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Sparkles,
  Tag,
  Boxes,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import StockToggle from "@/components/admin/StockToggle";
import { api } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNTRACKED"
  >("ALL");

  // Stock Adjustment Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [stockAction, setStockAction] = useState<"add" | "reduce" | "set">("add");
  const [stockQty, setStockQty] = useState<number | "">("");
  const [stockNotes, setStockNotes] = useState("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockFeedback, setStockFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    api.products
      .getAll()
      .then((res) => {
        setProducts(res.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products for admin:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["ALL", ...Array.from(cats)];
  }, [products]);

  // Compute stock counts for filtering badges
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let untracked = 0;

    products.forEach((p) => {
      if (!p.trackStock) {
        untracked++;
      } else {
        const qty = p.stockQuantity ?? 0;
        const alertThreshold = p.lowStockAlert ?? 5;
        if (qty <= 0) {
          outOfStock++;
        } else if (qty <= alertThreshold) {
          lowStock++;
        } else {
          inStock++;
        }
      }
    });

    return { total: products.length, inStock, lowStock, outOfStock, untracked };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== "ALL" && product.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter !== "ALL") {
        const isTracked = product.trackStock === true;
        const qty = product.stockQuantity ?? 0;
        const alertThreshold = product.lowStockAlert ?? 5;

        if (stockStatusFilter === "UNTRACKED" && isTracked) return false;
        if (stockStatusFilter === "IN_STOCK" && (!isTracked || qty <= alertThreshold)) return false;
        if (stockStatusFilter === "LOW_STOCK" && (!isTracked || qty <= 0 || qty > alertThreshold)) return false;
        if (stockStatusFilter === "OUT_OF_STOCK" && (!isTracked || qty > 0)) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (product.name || "").toLowerCase();
        const cat = (product.category || "").toLowerCase();
        const desc = (product.description || "").toLowerCase();
        const slug = (product.slug || "").toLowerCase();

        if (!name.includes(q) && !cat.includes(q) && !desc.includes(q) && !slug.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  const openStockModal = (product: any, defaultAction: "add" | "reduce" | "set" = "add") => {
    setAdjustingProduct(product);
    setStockAction(defaultAction);
    setStockQty("");
    setStockNotes("");
    setStockFeedback(null);
  };

  const closeStockModal = () => {
    setAdjustingProduct(null);
    setStockQty("");
    setStockNotes("");
    setStockFeedback(null);
  };

  const calculatePreviewStock = () => {
    if (!adjustingProduct) return 0;
    const current = adjustingProduct.stockQuantity ?? 0;
    const qty = typeof stockQty === "number" ? stockQty : 0;
    if (stockAction === "add") return current + qty;
    if (stockAction === "reduce") return Math.max(0, current - qty);
    if (stockAction === "set") return Math.max(0, qty);
    return current;
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const qty = typeof stockQty === "number" ? stockQty : parseInt(String(stockQty), 10);
    if (isNaN(qty) || (qty <= 0 && stockAction !== "set")) {
      setStockFeedback({ type: "error", message: "Please enter a valid quantity." });
      return;
    }

    setIsSubmittingStock(true);
    setStockFeedback(null);

    try {
      const productId = adjustingProduct.id || adjustingProduct._id;
      const res = await api.products.adjustStock(productId, {
        action: stockAction,
        quantity: qty,
        notes: stockNotes || undefined,
      });

      // Update local products list
      setProducts((prev) =>
        prev.map((p) => {
          const pId = p.id || p._id;
          if (pId === productId) {
            return {
              ...p,
              trackStock: true,
              stockQuantity: res.stockQuantity,
              isAvailable: res.isAvailable,
            };
          }
          return p;
        })
      );

      setStockFeedback({
        type: "success",
        message: `Stock updated to ${res.stockQuantity} units!`,
      });

      setTimeout(() => {
        closeStockModal();
      }, 800);
    } catch (err: any) {
      setStockFeedback({
        type: "error",
        message: err.message || "Failed to adjust stock. Please try again.",
      });
    } finally {
      setIsSubmittingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-16 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight truncate">Products</h1>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-black rounded-full shrink-0">
            {products.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={fetchProducts}
            className="p-2 bg-white rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Refresh Products"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition-all shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* SEARCH BAR & 100% FIT DUAL DROPDOWNS (ZERO HORIZONTAL SCROLL) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-2.5">
        {/* Search Input Row */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dishes by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2-Column Responsive Filter Selectors (Fits 100% on all mobile screens, no horizontal scroll) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Selector */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-800 pr-7 focus:outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer truncate"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? `All Categories (${products.length})` : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Stock Status Selector */}
          <div className="relative">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full appearance-none bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-800 pr-7 focus:outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer truncate"
            >
              <option value="ALL">All Stock ({stockCounts.total})</option>
              <option value="IN_STOCK">🟢 In Stock ({stockCounts.inStock})</option>
              <option value="LOW_STOCK">🟡 Low Stock ({stockCounts.lowStock})</option>
              <option value="OUT_OF_STOCK">🔴 Out of Stock ({stockCounts.outOfStock})</option>
              <option value="UNTRACKED">⚪ Untracked ({stockCounts.untracked})</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Active Filter Indicator & Clear Option */}
        {(searchQuery || selectedCategory !== "ALL" || stockStatusFilter !== "ALL") && (
          <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
            <span className="text-stone-500 font-medium">
              Showing <strong>{filteredProducts.length}</strong> of {products.length} dishes
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setStockStatusFilter("ALL");
              }}
              className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* MOBILE LIST VIEW (PURE DIV CARDS - NO TABLES ON MOBILE) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const isTracked = product.trackStock === true;
          const stockQty = product.stockQuantity ?? 0;
          const lowAlert = product.lowStockAlert ?? 5;
          const isOutOfStock = isTracked && stockQty <= 0;
          const isLowStock = isTracked && stockQty > 0 && stockQty <= lowAlert;

          return (
            <div
              key={product.id || product._id}
              className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-xs space-y-3 relative overflow-hidden"
            >
              {/* Product Header Row: Image + Details + Toggle */}
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-18 h-18 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-stone-400" />
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-1 left-1 bg-purple-600 text-white p-0.5 rounded-full shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Name, Category, Price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                      {product.category || "General"}
                    </span>
                    <StockToggle
                      productId={product.id || product._id}
                      initialAvailable={product.isAvailable ?? true}
                    />
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 leading-snug mt-1 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Price Tag */}
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {product.priceType === "weight" ? (
                      <span className="font-black text-sm text-stone-900">
                        Rs. {product.pricePerKg}{" "}
                        <span className="text-[11px] font-medium text-stone-500">/kg</span>
                      </span>
                    ) : product.variants && product.variants.length > 0 ? (
                      product.variants.length === 1 ? (
                        <span className="font-black text-sm text-stone-900">
                          Rs. {product.variants[0].price}{" "}
                          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                            /{product.variants[0].name}
                          </span>
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.variants.map((v: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200"
                            >
                              {v.name}: <strong className="text-orange-600">Rs.{v.price}</strong>
                            </span>
                          ))}
                        </div>
                      )
                    ) : (
                      <span className="text-stone-400 text-xs font-medium">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Inventory & Availability Controls Row */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                {/* Left: Stock Status */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isTracked ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 border shadow-2xs ${
                          isOutOfStock
                            ? "bg-red-50 text-red-700 border-red-200"
                            : isLowStock
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        <Package className="w-3 h-3" />
                        <span>{stockQty} units</span>
                        {isOutOfStock && <span className="text-[9px] uppercase font-bold text-red-700">(Out)</span>}
                        {isLowStock && <span className="text-[9px] uppercase font-bold text-amber-700">(Low)</span>}
                      </span>

                      {/* Quick + and - buttons */}
                      <button
                        onClick={() => openStockModal(product, "reduce")}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 active:scale-95 transition-all cursor-pointer"
                        title="Reduce Stock (-1)"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openStockModal(product, "add")}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 active:scale-95 transition-all cursor-pointer"
                        title="Add Stock (+1)"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openStockModal(product, "set")}
                      className="text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1 rounded-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Boxes className="w-3.5 h-3.5 text-stone-500" />
                      Track Stock
                    </button>
                  )}
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openStockModal(product, "set")}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    title="Adjust Stock"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to={`/admin/products/${product.id || product._id}/edit`}
                    className="py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-orange-600" />
                    <span>Edit</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="font-bold text-stone-700 text-sm">No products found</p>
            <p className="text-xs text-stone-400">
              Try adjusting your search query or category filters.
            </p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (HIDDEN ON MOBILE, ACTIVE ON MD+) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock & Inventory</th>
                <th className="p-4">Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((product: any) => {
                const isTracked = product.trackStock === true;
                const stockQty = product.stockQuantity ?? 0;
                const lowAlert = product.lowStockAlert ?? 5;
                const isOutOfStock = isTracked && stockQty <= 0;
                const isLowStock = isTracked && stockQty > 0 && stockQty <= lowAlert;

                return (
                  <tr key={product.id || product._id} className="hover:bg-stone-50/70 transition-colors">
                    {/* IMAGE */}
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-lg bg-stone-100 relative overflow-hidden border border-stone-200 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </td>

                    {/* NAME & CATEGORY */}
                    <td className="p-4">
                      <p className="font-bold text-stone-900 text-sm leading-snug">{product.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-stone-500 font-medium">{product.category}</span>
                        {product.isFeatured && (
                          <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="p-4 font-black text-stone-900">
                      {product.priceType === "weight" ? (
                        <span>
                          Rs. {product.pricePerKg} <span className="text-xs font-normal text-stone-500">/kg</span>
                        </span>
                      ) : product.variants && product.variants.length > 0 ? (
                        product.variants.length === 1 ? (
                          <span>
                            Rs. {product.variants[0].price}{" "}
                            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                              /{product.variants[0].name}
                            </span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {product.variants.map((v: any, idx: number) => (
                              <span
                                key={idx}
                                className="text-[11px] font-bold bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200 whitespace-nowrap"
                              >
                                {v.name}: <span className="text-orange-600 font-black">Rs. {v.price}</span>
                              </span>
                            ))}
                          </div>
                        )
                      ) : (
                        <span className="text-stone-400 font-medium">—</span>
                      )}
                    </td>

                    {/* STOCK & INVENTORY COLUMN */}
                    <td className="p-4">
                      {isTracked ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 border shadow-2xs ${
                              isOutOfStock
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isLowStock
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>
                              {stockQty} {stockQty === 1 ? "unit" : "units"}
                            </span>
                            {isOutOfStock && (
                              <span className="text-[10px] font-bold bg-red-200 text-red-900 px-1 rounded uppercase">
                                Out
                              </span>
                            )}
                            {isLowStock && (
                              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1 rounded uppercase">
                                Low
                              </span>
                            )}
                          </span>

                          {/* Quick Add / Reduce Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openStockModal(product, "add")}
                              title="Add Stock (+)"
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStockModal(product, "reduce")}
                              title="Reduce Stock (-)"
                              className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStockModal(product, "set")}
                              title="Adjust/Set Stock"
                              className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                            Untracked
                          </span>
                          <button
                            onClick={() => openStockModal(product, "set")}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                          >
                            + Track Stock
                          </button>
                        </div>
                      )}
                    </td>

                    {/* AVAILABILITY TOGGLE */}
                    <td className="p-4">
                      <StockToggle
                        productId={product.id || product._id}
                        initialAvailable={product.isAvailable ?? true}
                      />
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/products/${product.id || product._id}/edit`}
                        className="inline-flex items-center justify-center p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-black rounded-lg transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-400 font-medium">
                    No products match your search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK STOCK ADJUST MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">Quick Stock Adjustment</h3>
                  <p className="text-xs text-stone-500 font-medium">{adjustingProduct.name}</p>
                </div>
              </div>
              <button
                onClick={closeStockModal}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAdjustStockSubmit} className="p-5 space-y-4">
              {/* Current Stock Banner */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Current Live Stock
                  </span>
                  <span className="text-lg font-black text-stone-900">
                    {adjustingProduct.trackStock ? `${adjustingProduct.stockQuantity ?? 0} units` : "Untracked"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Resulting Stock
                  </span>
                  <span className="text-lg font-black text-orange-600">{calculatePreviewStock()} units</span>
                </div>
              </div>

              {/* Action Tabs: Add | Reduce | Set */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1.5">Adjustment Mode</label>
                <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStockAction("add")}
                    className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAction === "add"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAction("reduce")}
                    className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAction === "reduce"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    - Reduce
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAction("set")}
                    className={`py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      stockAction === "set"
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    = Set Exact
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {stockAction === "add"
                    ? "Units to Add (+)"
                    : stockAction === "reduce"
                    ? "Units to Deduct (-)"
                    : "Set Exact Stock Count (=)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  autoFocus
                  required
                  placeholder={stockAction === "set" ? "e.g. 50" : "e.g. 10"}
                  value={stockQty}
                  onChange={(e) =>
                    setStockQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full text-lg font-black px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-400">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(stockAction === "add"
                    ? [1, 5, 10, 20, 50, 100]
                    : stockAction === "reduce"
                    ? [1, 5, 10, 20, 50]
                    : [0, 10, 25, 50, 100]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStockQty(preset)}
                      className="px-2.5 py-1 text-xs font-black bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer border border-stone-200"
                    >
                      {stockAction === "add" ? `+${preset}` : stockAction === "reduce" ? `-${preset}` : `${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Reason / Notes */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Reason / Notes <span className="font-normal text-stone-400 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery, Wasted, Recount"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              {/* Feedback Alert */}
              {stockFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    stockFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {stockFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{stockFeedback.message}</span>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeStockModal}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStock}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingStock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Confirm Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


