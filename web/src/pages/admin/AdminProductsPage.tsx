import React, { useEffect, useState } from "react";
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
  TrendingDown
} from "lucide-react";
import StockToggle from "@/components/admin/StockToggle";
import { api } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [stockAction, setStockAction] = useState<"add" | "reduce" | "set">("add");
  const [stockQty, setStockQty] = useState<number | "">("");
  const [stockNotes, setStockNotes] = useState("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockFeedback, setStockFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.products
      .getAll()
      .then((res) => {
        if (isMounted) {
          setProducts(res.products || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products for admin:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (isNaN(qty) || qty <= 0 && stockAction !== "set") {
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
      }, 900);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Manage your dishes, drinks, prices, and live inventory stock
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-black px-4 py-2.5 rounded-xl hover:bg-orange-500 transition-all shadow-md shadow-orange-600/20 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-white" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 md:p-0">
          <table className="block md:table w-full text-left">
            <thead className="hidden md:table-header-group bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Image</th>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Product Name</th>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Price</th>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Stock & Inventory</th>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Availability</th>
                <th className="p-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-stone-100 md:divide-y-0">
              {products.map((product: any) => {
                const isTracked = product.trackStock === true;
                const stockQty = product.stockQuantity ?? 0;
                const lowAlert = product.lowStockAlert ?? 5;
                const isOutOfStock = isTracked && stockQty <= 0;
                const isLowStock = isTracked && stockQty > 0 && stockQty <= lowAlert;

                return (
                  <tr
                    key={product.id || product._id}
                    className="block md:table-row bg-white md:bg-transparent border border-stone-200 md:border-0 rounded-xl p-4 mb-4 md:mb-0 space-y-2.5 md:space-y-0 relative shadow-sm md:shadow-none hover:bg-stone-50/70 transition-colors"
                  >
                    {/* IMAGE */}
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Image
                      </span>
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
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Product Name
                      </span>
                      <div className="text-right md:text-left">
                        <p className="font-bold text-stone-900 leading-snug">{product.name}</p>
                        <div className="flex items-center gap-1.5 justify-end md:justify-start mt-0.5">
                          <span className="text-xs text-stone-500 font-medium">{product.category}</span>
                          {product.isFeatured && (
                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-black text-stone-900">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Price
                      </span>
                      <div className="flex flex-col items-end md:items-start gap-0.5">
                        {product.priceType === "weight" ? (
                          <span className="font-black text-stone-900">
                            Rs. {product.pricePerKg} <span className="text-xs font-normal text-stone-500">/kg</span>
                          </span>
                        ) : product.variants && product.variants.length > 0 ? (
                          product.variants.length === 1 ? (
                            <span className="font-black text-stone-900">
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
                      </div>
                    </td>

                    {/* STOCK & INVENTORY COLUMN */}
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Stock
                      </span>
                      <div className="flex flex-col items-end md:items-start gap-1.5">
                        {isTracked ? (
                          <div className="flex items-center gap-2">
                            {/* Stock Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 border shadow-xs ${
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
                              {isOutOfStock ? (
                                <span className="text-[10px] font-bold bg-red-200 text-red-900 px-1 rounded uppercase">
                                  Out
                                </span>
                              ) : isLowStock ? (
                                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1 rounded uppercase">
                                  Low
                                </span>
                              ) : null}
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
                              + Set Stock
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* AVAILABILITY TOGGLE */}
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Availability
                      </span>
                      <div>
                        <StockToggle
                          productId={product.id || product._id}
                          initialAvailable={product.isAvailable ?? true}
                        />
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="flex md:table-cell justify-between items-center p-0 md:p-4 last:border-0 pt-1 md:pt-0">
                      <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                        Actions
                      </span>
                      <Link
                        to={`/admin/products/${product.id || product._id}/edit`}
                        className="inline-flex items-center justify-center p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-black rounded-lg transition-colors cursor-pointer"
                        title="Edit Full Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr className="block md:table-row bg-white md:bg-transparent">
                  <td colSpan={6} className="block md:table-cell p-8 text-center text-stone-400 font-medium">
                    No products found. Add one to get started.
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
                    {adjustingProduct.trackStock ? (
                      `${adjustingProduct.stockQuantity ?? 0} units`
                    ) : (
                      "Untracked"
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Resulting Stock
                  </span>
                  <span className="text-lg font-black text-orange-600">
                    {calculatePreviewStock()} units
                  </span>
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
                  onChange={(e) => setStockQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
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

