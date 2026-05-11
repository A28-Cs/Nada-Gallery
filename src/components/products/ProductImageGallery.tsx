import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '../../config/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const goTo = (index: number) => {
    if (index >= 0 && index < displayImages.length) {
      setSelectedIndex(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative rounded-none overflow-hidden border border-dark-800 bg-dark-900">
        <div className="aspect-square flex items-center justify-center p-6 bg-dark-950">
          <img
            src={currentImage}
            alt={productName}
            className="max-w-full max-h-full object-contain transition-all duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => goTo(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              className="absolute start-3 top-1/2 -translate-y-1/2 p-2 bg-white text-dark-950 rounded-none hover:bg-dark-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <button
              onClick={() => goTo(selectedIndex + 1)}
              disabled={selectedIndex === displayImages.length - 1}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-2 bg-white text-dark-950 rounded-none hover:bg-dark-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-dark-950 text-xs font-medium tracking-widest text-white border border-dark-700 rounded-none shadow-xl">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-none overflow-hidden border transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-astro-500 shadow-xl'
                  : 'border-dark-700 hover:border-dark-500 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="w-full h-full bg-dark-800 flex items-center justify-center p-1">
                <img
                  src={img}
                  alt={`${productName} ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
