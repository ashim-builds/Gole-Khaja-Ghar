import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | '4/3' | '16/9' | 'auto';
  containerClassName?: string;
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  aspectRatio = 'square',
  className = '',
  containerClassName = '',
  fallbackSrc = '/images/logo.png',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : '';

  const currentSrc = hasError ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}>
      {/* Animated Skeleton Pulse Placeholder to eliminate blank flash */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-orange-400 animate-spin opacity-40" />
        </div>
      )}

      {/* High-performance image with async decoding and off-thread decoding */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          } else {
            const target = e.currentTarget;
            if (!target.src.endsWith('/images/logo.png')) {
              target.src = '/images/logo.png';
            }
          }
        }}
        className={`w-full h-full object-cover transition-all duration-500 ease-out ${
          isLoaded ? 'opacity-100 scale-100 filter-none' : 'opacity-0 scale-105 blur-xs'
        } ${className}`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
