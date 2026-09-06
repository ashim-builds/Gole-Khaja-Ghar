"use client";

import { useState } from "react";
import { Plus, Minus, CheckCircle2 } from "lucide-react";
import { useCart, CartProduct } from "@/context/CartContext";

interface Variant {
  name: string;
  price: number;
}

// Extending CartProduct to ensure it matches the full DB product data needed here
interface ProductProps extends CartProduct {
  variants?: Variant[];
  weightOptions?: { value: number; unit: string }[];
  allowCustomWeight?: boolean;
}

interface WeightSelectorProps {
  product: ProductProps;
  isAvailable: boolean;
}

const DEFAULT_PRESET_WEIGHTS = [
  { value: 250, unit: "g" },
  { value: 500, unit: "g" },
  { value: 750, unit: "g" },
  { value: 1, unit: "kg" },
];

export default function WeightSelector({ product, isAvailable }: WeightSelectorProps) {
  const { addWeightItem, addVariantItem } = useCart();
  
  const [weight, setWeight] = useState<number>(500); 
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customWeightStr, setCustomWeightStr] = useState<string>("");
  
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const [qty, setQty] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  // Price Calculation
  let finalPrice = "0.00";
  if (product.priceType === 'weight' && product.pricePerKg) {
    finalPrice = Math.max(0, (weight / 1000) * product.pricePerKg * qty).toFixed(2);
  } else if (product.priceType === 'variant' && selectedVariant) {
    finalPrice = (selectedVariant.price * qty).toFixed(2);
  }

  const weightOptions = product.weightOptions && product.weightOptions.length > 0 
    ? product.weightOptions 
    : DEFAULT_PRESET_WEIGHTS;

  const allowCustom = product.allowCustomWeight !== false; // defaults to true if undefined

  const handlePresetSelect = (val: number, unit: string) => {
    const grams = unit === 'kg' ? val * 1000 : val;
    setWeight(grams);
    setIsCustom(false);
    setCustomWeightStr("");
  };

  const handleCustomSelect = () => {
    if (!allowCustom) return;
    setIsCustom(true);
    setWeight(customWeightStr ? parseInt(customWeightStr, 10) || 0 : 0);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomWeightStr(val);
    
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setWeight(num);
    } else {
      setWeight(0);
    }
  };

  const increaseQty = () => setQty(prev => prev + 1);
  const decreaseQty = () => setQty(prev => prev > 1 ? prev - 1 : 1);

  const handleAddToCart = () => {
    if (!isAvailable) return;
    if (product.priceType === 'weight' && weight <= 0) return;
    if (product.priceType === 'variant' && !selectedVariant) return;
    
    if (product.priceType === 'weight') {
      addWeightItem(product, weight, qty);
    } else if (product.priceType === 'variant' && selectedVariant) {
      addVariantItem(product, selectedVariant.name, selectedVariant.price, qty);
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col mt-4">
      
      {/* Option Selector */}
      <div className="mb-6">
        <p className="font-bold text-black mb-3 text-[15px]">
          {product.priceType === 'weight' ? "Select Weight" : "Select Variant"}
        </p>
        
        {product.priceType === 'weight' ? (
          <div className="flex flex-wrap gap-2">
            {weightOptions.map((preset, idx) => {
              const presetGrams = preset.unit === 'kg' ? preset.value * 1000 : preset.value;
              return (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(preset.value, preset.unit)}
                  className={`py-2 px-4 rounded-md font-semibold text-sm transition-all border ${
                    !isCustom && weight === presetGrams
                      ? "border-primary bg-primary/10 text-stone-900"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {preset.value}{preset.unit}
                </button>
              );
            })}
            
            {allowCustom && (
              <button
                onClick={handleCustomSelect}
                className={`py-2 px-4 rounded-md font-semibold text-sm transition-all border ${
                  isCustom
                    ? "border-primary bg-primary/10 text-stone-900"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                Custom Weight
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {product.variants?.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedVariant(v)}
                className={`py-2 px-4 rounded-md font-semibold text-sm transition-all border ${
                  selectedVariant?.name === v.name
                    ? "border-primary bg-primary/10 text-stone-900"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Weight Input */}
      {product.priceType === 'weight' && isCustom && (
        <div className="mb-6 transition-all duration-300">
          <p className="font-bold text-black mb-2 text-[14px]">
            Custom Weight <span className="text-stone-500 font-normal">(in gram)</span>
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              step="1"
              value={customWeightStr}
              onChange={handleCustomChange}
              className="w-[120px] py-2 px-3 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-stone-900 font-bold text-sm shadow-sm"
            />
            <div className="text-[14px] text-stone-600">
              Total: <span className="font-black text-black">Rs. {finalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* Total display if not custom weight */}
      {!(product.priceType === 'weight' && isCustom) && (
        <div className="mb-6 flex items-center gap-4">
           <div className="text-[14px] text-stone-600">
            Total: <span className="font-black text-black">Rs. {finalPrice}</span>
          </div>
        </div>
      )}

      {/* Qty */}
      <div className="mb-6">
        <p className="font-bold text-black mb-3 text-[15px]">Qty</p>
        <div className="flex items-center border border-stone-200 rounded-md w-fit bg-white">
          <button onClick={decreaseQty} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-black hover:bg-stone-50 rounded-l-md transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 flex items-center justify-center border-x border-stone-200 text-black font-bold text-sm">
            {qty}
          </div>
          <button onClick={increaseQty} className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-black hover:bg-stone-50 rounded-r-md transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isAvailable || (product.priceType === 'weight' && weight <= 0) || (product.priceType === 'variant' && !selectedVariant) || isAdded}
        className={`w-full h-[48px] rounded-md flex items-center justify-center transition-all ${
          !isAvailable || (product.priceType === 'weight' && weight <= 0) || (product.priceType === 'variant' && !selectedVariant)
            ? "bg-stone-200 text-stone-400 cursor-not-allowed"
            : isAdded
            ? "bg-green-500 text-white"
            : "bg-orange-600 text-white hover:bg-orange-500 font-black uppercase text-sm tracking-wider shadow-md shadow-orange-600/20"
        }`}
      >
        {isAdded ? (
          <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> ADDED TO CART</span>
        ) : !isAvailable ? (
          "SOLD OUT"
        ) : (
          "ADD TO CART"
        )}
      </button>
    </div>
  );
}
