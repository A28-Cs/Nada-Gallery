import { useState, useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';
import { PLACEHOLDER_IMAGE } from '../../config/constants';

interface ProductCardImageProps {
  src: string;
  alt: string;
  fit?: 'contain' | 'cover';
  scale?: number;
  posX?: number;
  posY?: number;
  bg?: string;
}

export default function ProductCardImage({ 
  src, 
  alt,
  fit,
  scale,
  posX,
  posY,
  bg
}: ProductCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentSrc = error ? PLACEHOLDER_IMAGE : src;

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const eventSrc = event.currentTarget.currentSrc || event.currentTarget.src;
    if (eventSrc !== currentSrc) return;
    setLoaded(true);
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const eventSrc = event.currentTarget.currentSrc || event.currentTarget.src;
    if (eventSrc !== currentSrc || currentSrc === PLACEHOLDER_IMAGE) return;
    setError(true);
    setLoaded(true);
  };

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  // Robust check for images already loaded from browser cache
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [currentSrc]);

  // Default values
  const imageFit = fit || 'contain';
  const imageScale = scale || 1;
  const imagePositionX = posX ?? 50;
  const imagePositionY = posY ?? 50;
  // If bg is provided, use it. Otherwise use a default dark fallback
  const backgroundStyle = bg ? { backgroundColor: bg } : {};

  return (
    <div 
      className="w-full h-56 sm:h-64 lg:h-72 relative flex items-center justify-center overflow-hidden bg-dark-900"
      style={backgroundStyle}
    >
      
      {/* Blurred Background Layer (Fill to avoid empty space) - Only show if no custom bg is set */}
      {!bg && (
        <div 
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ${loaded ? 'opacity-60' : 'opacity-0'}`}
        >
          <img 
            key={`background-${currentSrc}`}
            src={currentSrc} 
            alt="" 
            className="w-full h-full object-cover scale-[1.3] blur-[24px] brightness-[0.4] saturate-150"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-dark-900" />
        </div>
      )}

      {/* Main Foreground Image Wrapper (Handles hover zoom independently of manual scale) */}
      <div 
        className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-700 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <img
          key={`foreground-${currentSrc}`}
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          className="w-full h-full drop-shadow-2xl"
          style={{
            objectFit: imageFit,
            objectPosition: `${imagePositionX}% ${imagePositionY}%`,
            transform: `scale(${imageScale})`
          }}
        />
      </div>

      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-dark-800/50 animate-pulse z-20" />
      )}
      
      {/* Inner Shadow overlay to naturally blend image edges */}
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] pointer-events-none z-30" />
    </div>
  );
}
