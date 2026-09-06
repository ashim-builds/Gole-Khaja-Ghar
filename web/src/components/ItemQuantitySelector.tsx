"use client";

import { useState } from "react";
import { Plus, Minus, CheckCircle2 } from "lucide-react";
import { useCart, CartProduct } from "@/context/CartContext";

interface Variant {
  name: string;
  price: number;
}

interface ProductProps extends CartProduct {
  variants?: Variant[];
  weightOptions?: { value: number; unit: string }[];
  allowCustomWeight?: boolean;
}

interface ItemQuantitySelectorProps {
  product: ProductProps;
  isAvailable: boolean;
}

export default function ItemQuantitySelector({ product, isAvailable }: ItemQuantitySelectorProps) {
  const { addVariantItem, addWeightItem } = useCart();
  
  const hasVariants = product.variants && product.variants.length > 0;
  
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    hasVariants ? product.variants![0] : null
  );

  // Sync selected variant if product changes
  useState(() => {
    if (hasVariants && product.variants && product.variants.length > 0) {
      if (!selectedVariant || !product.variants.some(v => v.name === selectedVariant.name)) {
        setSelectedVariant(product.variants[0]);
      }
    }
  });

  const [qty, setQty] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  // Price Calculation
  let unitPrice = 0;
  if (hasVariants && selectedVariant) {
    unitPrice = selectedVariant.price;
  } else if (product.pricePerKg) {
    unitPrice = product.pricePerKg;
  }

  const finalPrice = (unitPrice * qty).toFixed(2);

  const increaseQty = () => setQty((prev) => prev + 1);
  const decreaseQty = () => setQty((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!isAvailable) return;

    if (hasVariants && selectedVariant) {
      addVariantItem(product, selectedVariant.name, selectedVariant.price, qty);
    } else if (product.priceType === "weight" && product.pricePerKg) {
      // Graceful fallback for legacy weight items
      addWeightItem(product, 500, qty);
    } else {
      addVariantItem(product, "Standard", unitPrice, qty);
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col mt-4">
      {/* Portion / Variant Selector */}
      {hasVariants && (
        <div className="mb-6">
          <p className="font-bold text-black mb-3 text-[15px]">Select Portion / Option</p>
          <div className="flex flex-wrap gap-2.5">
            {product.variants!.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariant(v)}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm transition-all border-2 cursor-pointer ${
                  selectedVariant?.name === v.name
                    ? "border-orange-600 bg-orange-600 text-white font-black shadow-md shadow-orange-600/25"
                    : "border-stone-200 bg-white text-stone-800 hover:border-stone-300 font-bold"
                }`}
              >
                {v.name} <span className={`font-semibold ml-1.5 ${selectedVariant?.name === v.name ? "text-orange-100" : "text-stone-500"}`}>Rs. {v.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector & Price Summary */}
      <div className="mb-6 flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200/80">
        <div>
          <p className="font-bold text-stone-900 text-sm mb-1">Quantity</p>
          <div className="flex items-center border border-stone-200 rounded-lg w-fit bg-white shadow-sm">
            <button
              onClick={decreaseQty}
              aria-label="Decrease quantity"
              className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-black hover:bg-stone-50 rounded-l-lg transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 flex items-center justify-center border-x border-stone-200 text-black font-black text-sm">
              {qty}
            </div>
            <button
              onClick={increaseQty}
              aria-label="Increase quantity"
              className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-black hover:bg-stone-50 rounded-r-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Price</p>
          <p className="text-2xl font-black text-stone-900">Rs. {finalPrice}</p>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isAvailable || isAdded}
        className={`w-full h-[52px] rounded-xl flex items-center justify-center transition-all cursor-pointer font-black uppercase text-sm tracking-wider shadow-lg ${
          !isAvailable
            ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
            : isAdded
            ? "bg-emerald-600 text-white shadow-emerald-600/20"
            : "bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/30 active:scale-[0.99]"
        }`}
      >
        {isAdded ? (
          <span className="flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> ADDED TO ORDER
          </span>
        ) : !isAvailable ? (
          "SOLD OUT"
        ) : (
          "ADD TO ORDER"
        )}
      </button>
    </div>
  );
}
