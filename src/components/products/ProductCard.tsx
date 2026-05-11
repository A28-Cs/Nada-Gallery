import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { getLocalizedDescription, getLocalizedName } from '../../utils/localizedContent';
import { getProductPrimaryImage } from '../../utils/productImages';
import StarRating from './StarRating';
import ProductCardImage from './ProductCardImage';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice : product.price;
  const isOutOfStock = product.stock <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const productName = getLocalizedName(product, i18n.language);
  const productDescription = getLocalizedDescription(product, i18n.language);
  const primaryImage = getProductPrimaryImage(product);

  return (
    <div className="group bg-dark-950 border border-dark-800 rounded-xl overflow-hidden hover:border-astro-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full relative">
      
      {/* Badges */}
      <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20 pointer-events-none">
        {hasDiscount ? (
          <span className="px-2.5 py-1 bg-dark-950/80 backdrop-blur-md border border-dark-700 text-white text-xs font-bold rounded-full shadow-sm">
            -{discountPercent}%
          </span>
        ) : <div />}
        
        {product.featured && (
          <span className="p-1.5 bg-dark-950/80 backdrop-blur-md border border-dark-700 rounded-full shadow-sm">
            <Star className="w-3.5 h-3.5 text-astro-400 fill-astro-400" />
          </span>
        )}
      </div>

      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <ProductCardImage 
          src={primaryImage} 
          alt={productName} 
          fit={product.imageFit}
          scale={product.imageScale}
          posX={product.imagePositionX}
          posY={product.imagePositionY}
          bg={product.imageBg}
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300">
            <span className="px-5 py-2 bg-dark-900 border border-dark-700 text-dark-300 text-sm font-medium rounded-full shadow-xl">
              {t('productDetail.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1 bg-dark-950">
        <Link to={`/products/${product.id}`} className="mb-3 block">
          <h3 className="text-sm font-medium text-white tracking-wide uppercase group-hover:text-astro-400 transition-colors line-clamp-1 mb-2">
            {productName}
          </h3>
          <p className="text-sm text-dark-400 font-light line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {productDescription}
          </p>
        </Link>

        {/* Rating - Fixed height to ensure alignment even if no ratings exist */}
        <div className="mb-5 flex items-center gap-2 h-5">
          {(product.ratingCount ?? 0) > 0 ? (
            <>
              <StarRating rating={product.ratingAverage || 0} size="sm" />
              <span className="text-xs font-medium text-dark-400">
                {product.ratingAverage?.toFixed(1)} ({product.ratingCount})
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-auto pt-4 border-t border-dark-800/50">
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {formatCurrency(effectivePrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-medium text-dark-500 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
          </div>

          {onAddToCart && !isOutOfStock ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-transparent border border-dark-700 hover:bg-astro-500/10 hover:border-astro-500/40 text-white rounded-lg transition-all duration-300 font-medium text-sm group/btn"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('productDetail.addToCart')}</span>
            </button>
          ) : (
            /* Placeholder to maintain height when out of stock */
            <div className="w-full py-3 px-4 flex items-center justify-center border border-transparent">
               <span className="text-sm text-transparent select-none">-</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
