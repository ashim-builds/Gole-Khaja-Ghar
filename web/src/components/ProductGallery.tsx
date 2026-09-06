import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isAvailable: boolean;
}

export default function ProductGallery({ images, productName, isAvailable }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  // Deduplicate and filter empty
  const allImages = images.filter(Boolean);
  if (allImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="relative w-full aspect-square md:aspect-[4/5] rounded-[24px] bg-[#f5f5f5] overflow-hidden shadow-sm">
        <img
          src={allImages[activeImage] || "/images/logo.png"}
          alt={`${productName} - Image ${activeImage + 1}`}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('/images/logo.png')) {
              target.src = '/images/logo.png';
            }
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${!isAvailable ? 'grayscale opacity-80' : ''}`}
        />

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-xl md:text-3xl font-black text-white px-6 py-2 bg-red-600 rounded-lg shadow-2xl transform -rotate-12 border-4 border-red-700">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Image counter badge */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
            {activeImage + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                i === activeImage
                  ? 'border-primary shadow-md scale-105'
                  : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt={`${productName} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
