import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts, getCategories, Product } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";
import ScrollAnimation from "@/components/ScrollAnimation";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const query = searchParams.get("q") || undefined;
  const sort = searchParams.get("sort") || "popular";

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedProducts, allProds, fetchedCats] = await Promise.all([
          getProducts(category, query),
          getProducts(),
          getCategories(),
        ]);

        if (!active) return;

        let sorted = [...fetchedProducts];
        if (sort === "price-asc") {
          sorted.sort((a, b) => (a.pricePerKg ?? 0) - (b.pricePerKg ?? 0));
        } else if (sort === "price-desc") {
          sorted.sort((a, b) => (b.pricePerKg ?? 0) - (a.pricePerKg ?? 0));
        } else if (sort === "name-asc") {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }

        setProducts(sorted);
        setAllProducts(allProds);
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
  }, [category, query, sort]);

  return (
    <div className="bg-white min-h-screen pt-8 md:pt-12 pb-20 w-full relative z-10 flex-grow flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Page Header */}
        <ScrollAnimation className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-[#111111] uppercase tracking-tight mb-1">
            MENU
          </h1>
          <p className="text-[13px] text-stone-500 font-medium">Home / Menu</p>
        </ScrollAnimation>

        {/* Filters */}
        <ScrollAnimation delay={0.1}>
          <ShopFilters categories={categories} allProducts={allProducts} />
        </ScrollAnimation>

        {/* Product Grid */}
        <ScrollAnimation delay={0.2}>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 bg-[#fafafa] md:bg-transparent rounded-xl">
              {products.map((product) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-100">
              <h3 className="text-xl font-bold text-black mb-2">No items found</h3>
              <p className="text-stone-500">We couldn't find any menu items matching your search. Try different keywords or browse all categories.</p>
            </div>
          )}
        </ScrollAnimation>
      </div>
    </div>
  );
}
