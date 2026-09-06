import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { Search, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ShopFiltersProps {
  categories: string[];
  allProducts: { name: string; slug: string }[];
}

export default function ShopFilters({ categories, allProducts }: ShopFiltersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const currentCategory = searchParams.get("category") || "";
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "popular";
  
  const [searchValue, setSearchValue] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<{name: string, slug: string}[]>([]);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    
    if (val.trim().length > 0) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
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
      {/* Search Bar with Autocomplete */}
      <div className="relative w-full max-w-2xl" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search snacks, momo, chowmein, khaja..."
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => { if(searchValue) setShowSuggestions(true) }}
            className="w-full h-12 pl-12 pr-10 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 transition-all shadow-sm font-semibold"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          {searchValue && (
            <button 
              type="button" 
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-[8px] shadow-xl z-50 overflow-hidden">
            {suggestions.map((suggestion) => (
              <Link 
                key={suggestion.slug} 
                to={`/product/${suggestion.slug}`}
                className="block px-4 py-3 text-black font-medium hover:bg-stone-50 border-b border-stone-50 last:border-0"
                onClick={() => setShowSuggestions(false)}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-stone-300" />
                  {suggestion.name}
                </div>
              </Link>
            ))}
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
