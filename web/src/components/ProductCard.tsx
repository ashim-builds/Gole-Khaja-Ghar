import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

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
  priceType = 'weight',
  pricePerKg, 
  variants = [],
  image, 
  isAvailable = true 
}: ProductCardProps) {
  const [selectedWeight, setSelectedWeight] = useState<number>(250);
  
  // Default to the first variant if available
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants.length > 0 ? variants[0] : null);
  
  const [isAdded, setIsAdded] = useState(false);
  const { addWeightItem, addVariantItem } = useCart();

  const handleAddToCart = () => {
    if (!isAvailable) return;
    
    if (priceType === 'weight') {
      addWeightItem({ id, slug, name, priceType, pricePerKg, image }, selectedWeight, 1);
    } else if (priceType === 'variant' && selectedVariant) {
      addVariantItem({ id, slug, name, priceType, image }, selectedVariant.name, selectedVariant.price, 1);
    }
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const displayPrice = priceType === 'weight' && pricePerKg
    ? pricePerKg 
    : variants.length > 0
    ? (selectedVariant?.price || variants[0]?.price || 0)
    : pricePerKg || 0;

  return (
    <div className={`bg-white md:rounded-[12px] p-4 flex flex-row md:flex-col hover:shadow-xl hover:-translate-y-1 shadow-sm transition-all duration-300 border-b md:border border-stone-100 last:border-b-0 gap-4 md:gap-0 h-full relative items-center md:items-start ${!isAvailable ? 'opacity-70' : ''}`}>
      
      {/* Image */}
      <Link to={`/product/${slug}`} className="relative w-20 h-20 md:w-full md:h-auto md:aspect-square rounded-[8px] bg-[#f5f5f5] overflow-hidden flex-shrink-0 group">
        <img src={image} alt={name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'grayscale' : ''}`} />
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
        <p className="text-[13px] md:text-[14px] font-black text-stone-900 mb-0 md:mb-4">
          Rs. {displayPrice} {priceType === 'weight' && <span className="text-stone-500 font-medium text-[11px] md:text-[12px]">/ kg</span>}
        </p>
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
                    ? 'border-primary bg-primary/10 text-stone-900' 
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {w >= 1000 ? `${w/1000}kg` : `${w}g`}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full mb-3 gap-1">
            {variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariant(v)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-md border transition-colors truncate px-1 cursor-pointer ${
                  selectedVariant?.name === v.name 
                    ? 'border-primary bg-primary/10 text-stone-900' 
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {/* Mobile Plus button */}
      <button 
        disabled={!isAvailable || isAdded || (priceType === 'variant' && !selectedVariant)}
        onClick={handleAddToCart}
        className={`md:hidden w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors shadow-sm cursor-pointer ${
          !isAvailable || (priceType === 'variant' && !selectedVariant)
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
            : isAdded 
            ? 'bg-green-500 text-white' 
            : 'bg-primary text-black hover:bg-primary/90'
        }`}
      >
        <span className="font-bold text-base">
          {isAdded ? '✓' : '+'}
        </span>
      </button>

      {/* Desktop ADD button */}
      <button 
        disabled={!isAvailable || isAdded || (priceType === 'variant' && !selectedVariant)}
        onClick={handleAddToCart}
        className={`hidden md:flex w-full h-[36px] rounded-md items-center justify-center flex-shrink-0 transition-colors shadow-sm cursor-pointer ${
          !isAvailable || (priceType === 'variant' && !selectedVariant)
            ? 'bg-stone-200 cursor-not-allowed' 
            : isAdded 
            ? 'bg-green-500' 
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        <span className={`font-black text-[13px] uppercase ${isAvailable && !isAdded ? 'text-black' : isAdded ? 'text-white' : 'text-stone-400'}`}>
          {isAdded ? 'ADDED' : isAvailable ? 'ADD' : 'SOLD OUT'}
        </span>
      </button>

    </div>
  );
}
