import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Check } from "lucide-react";

interface Variant {
  name: string;
  price: number;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  priceType?: 'weight' | 'variant';
  pricePerKg?: number;
  variants?: Variant[];
  image: string;
  category: string;
  isAvailable?: boolean;
}

export default function ProductCard({ 
  id, 
  slug, 
  name, 
  priceType = 'variant',
  pricePerKg, 
  variants = [],
  image, 
  isAvailable = true 
}: ProductCardProps) {
  const [selectedWeight, setSelectedWeight] = useState<number>(250);
  
  // Default to the first variant if available
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants.length > 0 ? variants[0] : null);
  
  // Keep selectedVariant in sync if variants prop updates
  useState(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  });

  const [isAdded, setIsAdded] = useState(false);
  const { addWeightItem, addVariantItem } = useCart();

  const handleAddToCart = () => {
    if (!isAvailable) return;
    
    if (priceType === 'weight') {
      addWeightItem({ id, slug, name, priceType, pricePerKg, image }, selectedWeight, 1);
    } else {
      const variantToUse = selectedVariant || (variants.length > 0 ? variants[0] : { name: "Regular", price: pricePerKg || 0 });
      addVariantItem({ id, slug, name, priceType: 'variant', image }, variantToUse.name, variantToUse.price, 1);
    }
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const displayPrice = priceType === 'weight' && pricePerKg
    ? pricePerKg 
    : variants.length > 0
    ? (selectedVariant?.price || variants[0]?.price || 0)
    : pricePerKg || 0;

  const currentPortionLabel = priceType === 'variant' 
    ? (selectedVariant?.name || (variants.length > 0 ? variants[0]?.name : '')) 
    : '';

  return (
    <div className={`bg-white md:rounded-[12px] p-4 flex flex-row md:flex-col hover:shadow-xl hover:-translate-y-1 shadow-sm transition-all duration-300 border-b md:border border-stone-100 last:border-b-0 gap-4 md:gap-0 h-full relative items-center md:items-start ${!isAvailable ? 'opacity-70' : ''}`}>
      
      {/* Image */}
      <Link to={`/product/${slug}`} className="relative w-20 h-20 md:w-full md:h-auto md:aspect-square rounded-[8px] bg-[#f5f5f5] overflow-hidden flex-shrink-0 group">
        <img 
          src={image || "/images/logo.png"} 
          alt={name} 
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('/images/logo.png')) {
              target.src = '/images/logo.png';
            }
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'grayscale' : ''}`} 
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-[8px] md:text-xs font-bold text-white px-1.5 py-0.5 bg-red-600 rounded shadow-md transform -rotate-12">OUT OF STOCK</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-grow flex flex-col items-start text-left w-full justify-center md:justify-start md:mt-3 pl-1 md:pl-0">
        <Link to={`/product/${slug}`} className="hover:text-primary transition-colors">
          <h3 className="font-bold text-black text-[14px] md:text-[15px] leading-tight mb-0.5 md:mb-1">{name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-1 md:mb-2">
          <p className="text-[13px] md:text-[15px] font-black text-stone-900">
            Rs. {displayPrice}
          </p>
          {priceType === 'weight' ? (
            <span className="text-stone-500 font-medium text-[11px] md:text-[12px]">/ kg</span>
          ) : currentPortionLabel ? (
            <span className="text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.2 rounded text-[10px] font-bold truncate max-w-[120px]">
              /{currentPortionLabel}
            </span>
          ) : null}
        </div>

        {/* Mobile Portion Quick-Select Chips (when multiple portions exist) */}
        {variants.length > 1 && priceType === 'variant' && (
          <div className="flex md:hidden items-center gap-1 mt-1.5 flex-wrap">
            {variants.map((v, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(v);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  (selectedVariant?.name || variants[0].name) === v.name
                    ? 'border-orange-600 bg-orange-600 text-white font-black shadow-sm'
                    : 'border-stone-200 text-stone-600 bg-stone-50 font-semibold hover:border-stone-300'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selection UI (Desktop Only) */}
      <div className="hidden md:block w-full">
        {priceType === 'weight' ? (
          <div className="flex items-center justify-between w-full mb-3 gap-1">
            {[250, 500, 1000].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeight(w)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                  selectedWeight === w 
                    ? 'border-orange-600 bg-orange-600 text-white font-black shadow-sm' 
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {w >= 1000 ? `${w/1000}kg` : `${w}g`}
              </button>
            ))}
          </div>
        ) : variants.length > 1 ? (
          <div className="flex items-center justify-between w-full mb-3 gap-1 flex-wrap">
            {variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariant(v)}
                className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-all truncate px-2 cursor-pointer ${
                  (selectedVariant?.name || variants[0].name) === v.name 
                    ? 'border-orange-600 bg-orange-600 text-white font-black shadow-sm' 
                    : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300 font-semibold'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="h-1 mb-2" />
        )}
      </div>

      {/* Action Button */}
      {/* Mobile Plus button */}
      <button 
        disabled={!isAvailable || isAdded}
        onClick={handleAddToCart}
        className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-md cursor-pointer ${
          !isAvailable
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
            : isAdded 
            ? 'bg-emerald-600 text-white' 
            : 'bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20'
        }`}
      >
        {isAdded ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <Plus className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Desktop ADD button */}
      <button 
        disabled={!isAvailable || isAdded}
        onClick={handleAddToCart}
        className={`hidden md:flex w-full h-[38px] rounded-xl items-center justify-center gap-1.5 flex-shrink-0 transition-all shadow-md cursor-pointer ${
          !isAvailable
            ? 'bg-stone-200 cursor-not-allowed shadow-none' 
            : isAdded 
            ? 'bg-emerald-600 text-white' 
            : 'bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">Added to Cart</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">Add to Cart</span>
          </>
        )}
      </button>

    </div>
  );
}
