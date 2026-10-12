import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { Search, X, ChevronDown, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import { searchItems } from "@/lib/searchUtils";
import { getSessionCache, setSessionCache } from "@/lib/clientCache";

interface SuggestionProduct {
  id?: string;
  name: string;
  slug: string;
  category?: string;
  pricePerKg?: number;
  image?: string;
  description?: string;
}

interface ShopFiltersProps {
  categories: string[];
  allProducts?: SuggestionProduct[];
}

export default function ShopFilters({ categories, allProducts }: ShopFiltersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const currentCategory = searchParams.get("category") || "";
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "popular";
  
  const [searchValue, setSearchValue] = useState(currentQuery);
  const [productList, setProductList] = useState<SuggestionProduct[]>(allProducts || []);
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: "popular", label: "Popular" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
  ];

  const currentSortLabel = sortOptions.find(o => o.value === currentSort)?.label || "Popular";

  // Pre-load all available products for instant client-side fuzzy searching (0ms SWR)
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      setProductList(allProducts);
    } else {
      let active = true;
      const cached = getSessionCache<SuggestionProduct[]>('golu_search_catalog', 5 * 60 * 1000);
      if (cached?.data && cached.data.length > 0) {
        setProductList(cached.data);
      }

      api.products.getAll(undefined, undefined, true, 1, 150).then((res) => {
        if (active && res.products) {
          setProductList(res.products);
          setSessionCache('golu_search_catalog', res.products);
        }
      }).catch(() => {});
      return () => { active = false; };
    }
  }, [allProducts]);

  useEffect(() => {
    setSearchValue(currentQuery);
  }, [currentQuery]);

  // Click outside to close suggestions and sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute fuzzy / acronym suggestions on search change
  const computeSuggestions = (val: string) => {
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = searchItems(productList, val.trim());
    setSuggestions(matches.slice(0, 6));
    setShowSuggestions(matches.length > 0);
    setSelectedIndex(-1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    computeSuggestions(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      e.preventDefault();
      const target = suggestions[selectedIndex];
      setShowSuggestions(false);
      navigate(`/product/${target.slug}`);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const updateFilters = (category: string, query: string, sort: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    if (sort && sort !== "popular") params.set("sort", sort);
    
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleCategoryClick = (category: string) => {
    const newCategory = currentCategory === category ? "" : category;
    updateFilters(newCategory, currentQuery, currentSort);
  };

  const handleSortSelect = (sort: string) => {
    setShowSort(false);
    updateFilters(currentCategory, currentQuery, sort);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    updateFilters(currentCategory, searchValue, currentSort);
  };

  const clearSearch = () => {
    setSearchValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    updateFilters(currentCategory, "", currentSort);
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Search Bar with Smart Fuzzy & Acronym Autocomplete */}
      <div className="relative w-full max-w-2xl" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative group">
          <input
            type="text"
            placeholder="Search snacks, momo, chowmein, c.momo, sekuwa..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchValue.trim()) computeSuggestions(searchValue);
            }}
            className="w-full h-12 pl-12 pr-10 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 transition-all shadow-sm font-semibold text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-orange-600 transition-colors" />
          {searchValue && (
            <button 
              type="button" 
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black cursor-pointer p-1"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Smart Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-stone-100 animate-in fade-in-50 duration-150">
            <div className="px-3.5 py-2 bg-stone-50/90 text-[11px] font-black uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-stone-600">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Quick Suggestions
              </span>
              <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
                Use ↑↓ to navigate, Enter to view
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <Link
                    key={item.slug || item.name}
                    to={`/product/${item.slug}`}
                    className={`flex items-center justify-between px-3.5 py-2.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-orange-50/80 text-orange-950" : "hover:bg-stone-50 text-stone-900"
                    }`}
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-stone-200/80 shrink-0 bg-stone-100"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900 truncate">
                            {item.name}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 shrink-0">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-stone-400 truncate max-w-xs sm:max-w-md">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.pricePerKg ? (
                        <span className="text-xs font-black text-orange-600 font-mono">
                          Rs. {item.pricePerKg}
                        </span>
                      ) : null}
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full px-3.5 py-2.5 bg-stone-50 hover:bg-orange-50 text-stone-600 hover:text-orange-600 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer border-t border-stone-100"
            >
              <span>Search all menu for "<strong className="text-stone-900">{searchValue}</strong>"</span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                <span>View all</span>
                <CornerDownLeft className="w-3 h-3" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Categories and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryClick("")}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all border cursor-pointer ${
              currentCategory === "" 
                ? "bg-orange-600 border-orange-600 text-white font-black shadow-md shadow-orange-600/20" 
                : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 font-bold"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-1.5 rounded-lg text-[13px] transition-all border cursor-pointer ${
                currentCategory === cat 
                  ? "bg-orange-600 border-orange-600 text-white font-black shadow-md shadow-orange-600/20" 
                  : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 font-bold"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort(v => !v)}
            className="flex items-center gap-2 bg-white border border-stone-200 rounded-[4px] px-3 py-1.5 text-[12px] font-semibold text-stone-600 hover:border-stone-300 transition-colors shadow-sm cursor-pointer"
          >
            Sort by: {currentSortLabel}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`} />
          </button>

          {showSort && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-stone-100 rounded-lg shadow-xl z-50 overflow-hidden min-w-[180px]">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSortSelect(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    currentSort === opt.value
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
