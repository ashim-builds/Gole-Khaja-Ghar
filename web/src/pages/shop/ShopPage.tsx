import { useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { getProducts, getCategories, Product } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";
import ScrollAnimation from "@/components/ScrollAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const category = searchParams.get("category") || undefined;
  const query = searchParams.get("q") || undefined;
  const sort = searchParams.get("sort") || "popular";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [productsRes, fetchedCats] = await Promise.all([
          getProducts(category, query, currentPage, ITEMS_PER_PAGE),
          getCategories(),
        ]);

        if (!active) return;

        let sorted = [...(productsRes.products || [])];
        if (sort === "price-asc") {
          sorted.sort((a, b) => (a.pricePerKg ?? 0) - (b.pricePerKg ?? 0));
        } else if (sort === "price-desc") {
          sorted.sort((a, b) => (b.pricePerKg ?? 0) - (a.pricePerKg ?? 0));
        } else if (sort === "name-asc") {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }

        setProducts(sorted);
        setTotalItems(productsRes.total);
        setTotalPages(productsRes.totalPages || 1);
        setCategories(fetchedCats);
      } catch (err) {
        console.error("Failed to load shop products:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [category, query, sort, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    const params = new URLSearchParams(searchParams);
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    navigate(`${location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white min-h-screen pt-8 md:pt-12 pb-20 w-full relative z-10 flex-grow flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <ScrollAnimation className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#111111] uppercase tracking-tight mb-1">
                MENU
              </h1>
              <p className="text-[13px] text-stone-500 font-medium">Home / Menu</p>
            </div>
            {!loading && totalItems > 0 && (
              <p className="text-xs font-semibold text-stone-500">
                Showing <span className="font-bold text-stone-900">{startItem}–{endItem}</span> of{" "}
                <span className="font-bold text-stone-900">{totalItems}</span> items
              </p>
            )}
          </div>
        </ScrollAnimation>

        {/* Filters */}
        <ScrollAnimation delay={0.1}>
          <ShopFilters categories={categories} />
        </ScrollAnimation>

        {/* Product Grid */}
        <div id="menu-grid" className="scroll-mt-24">
          <ScrollAnimation delay={0.2}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-stone-100 p-4 animate-pulse space-y-3"
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full aspect-square bg-stone-200 mx-auto" />
                    <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto md:mx-0" />
                    <div className="h-3 bg-stone-150 rounded w-1/2 mx-auto md:mx-0" />
                    <div className="h-9 bg-stone-200 rounded-xl w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`grid-${currentPage}-${category || 'all'}-${query || ''}-${sort}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 bg-[#fafafa] md:bg-transparent rounded-xl"
                  >
                    {products.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        slug={product.slug}
                        name={product.name}
                        pricePerKg={product.pricePerKg}
                        image={product.image}
                        category={product.category}
                        isAvailable={product.isAvailable}
                        variants={product.variants}
                        priceType={product.priceType}
                        index={idx}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 pt-6">
                  <div className="text-xs text-stone-500 font-medium">
                    Page <span className="font-bold text-stone-900">{currentPage}</span> of{" "}
                    <span className="font-bold text-stone-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, idx) =>
                        typeof pageNum === "number" ? (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                                : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ) : (
                          <span key={idx} className="px-2 text-xs font-bold text-stone-400">
                            {pageNum}
                          </span>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                      aria-label="Next Page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-100">
              <h3 className="text-xl font-bold text-black mb-2">No items found</h3>
              <p className="text-stone-500">
                We couldn't find any menu items matching your search. Try different keywords or browse all categories.
              </p>
            </div>
          )}
          </ScrollAnimation>
        </div>
      </div>
    </div>
  );
}
