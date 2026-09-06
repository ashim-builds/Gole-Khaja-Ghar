import React, { useTransition, useState } from "react";
import { api } from "@/lib/api";

interface StockToggleProps {
  productId: string;
  initialAvailable: boolean;
}

export default function StockToggle({ productId, initialAvailable }: StockToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticAvailable, setOptimisticAvailable] = useState(initialAvailable);

  const handleToggle = () => {
    const newValue = !optimisticAvailable;
    setOptimisticAvailable(newValue);
    startTransition(async () => {
      try {
        await api.products.toggleStock(productId, newValue);
      } catch {
        setOptimisticAvailable(!newValue);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={optimisticAvailable ? "Click to mark Out of Stock" : "Click to mark In Stock"}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border ${
        optimisticAvailable
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
      } ${isPending ? "opacity-60 cursor-wait" : ""}`}
    >
      <span
        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
          optimisticAvailable ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {isPending ? "Updating..." : optimisticAvailable ? "In Stock" : "Out of Stock"}
    </button>
  );
}
