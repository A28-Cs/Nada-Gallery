import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProductById } from '../../services/productService';
import { addToCart } from '../../services/cartService';
import { Product } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductImageGallery from '../../components/products/ProductImageGallery';
import StarRating from '../../components/products/StarRating';
import ReviewsSection from '../../components/products/ReviewsSection';
import RelatedProducts from '../../components/products/RelatedProducts';
import { ShoppingCart, Star, ArrowLeft, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedDescription, getLocalizedName } from '../../utils/localizedContent';
import { getProductImages } from '../../utils/productImages';

export default function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { currentUser, needsEmailVerification, userProfile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const data = await getProductById(productId);
      setProduct(data);
    } catch (err) {
      console.error(t('toast.failedToLoadProducts'), err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      toast.error(t('toast.pleaseLoginToAdd'));
      navigate('/login');
      return;
    }
    if (needsEmailVerification) {
      toast.error(t('toast.verifyBeforeCart'));
      navigate('/verify-email');
      return;
    }
    if (userProfile?.status === 'blocked') {
      toast.error(t('validation.accountBlockedContact'));
      return;
    }
    if (!product) return;
    try {
      await addToCart(currentUser.uid, product);
      toast.success(t('toast.productAddedToCart', { name: getLocalizedName(product, i18n.language) }));
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyBeforeCart'));
        navigate('/verify-email');
      } else {
        toast.error(err.message === 'cart/max-stock' ? t('toast.cannotExceedStock') : err.message || t('toast.failedToAddToCart'));
      }
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-dark-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('productDetail.notFoundTitle')}</h2>
        <p className="text-dark-400 mb-6">
          {t('productDetail.notFoundDescription')}
        </p>
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-3 bg-white text-dark-950 uppercase tracking-widest text-sm font-medium hover:bg-dark-200 transition-all rounded-none"
        >
          {t('common.browseProducts')}
        </button>
      </div>
    );
  }

  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice : product.price;
  const isOutOfStock = product.stock <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const productName = getLocalizedName(product, i18n.language);
  const productDescription = getLocalizedDescription(product, i18n.language);
  const productImages = getProductImages(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="relative">
          <ProductImageGallery images={productImages} productName={productName} />
          {hasDiscount && (
            <span className="absolute top-4 left-4 z-10 px-4 py-2 bg-dark-950 text-white text-xs font-medium uppercase tracking-widest rounded-none border border-dark-800 shadow-xl">
              -{discountPercent}% {t('productDetail.off')}
            </span>
          )}
          {product.featured && (
            <span className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-4 py-2 bg-astro-500 text-white text-xs font-medium uppercase tracking-widest rounded-none shadow-xl">
              <Star className="w-3.5 h-3.5 fill-white" /> {t('productDetail.featured')}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-light text-white mb-4 tracking-wide uppercase">{productName}</h1>

            {/* Rating summary */}
            {(product.ratingCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating
                  rating={product.ratingAverage || 0}
                  size="md"
                  showCount
                  count={product.ratingCount || 0}
                />
              </div>
            )}

            <p className="text-dark-400 leading-relaxed">{productDescription}</p>
          </div>

          <div className="flex items-baseline gap-4 mt-6">
            <span className="text-3xl font-medium text-white">
              {formatCurrency(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-dark-500 line-through font-light">
                {formatCurrency(product.price)}
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1 bg-dark-800 text-dark-300 text-xs font-medium uppercase tracking-widest rounded-none">
                {t('productDetail.save', { amount: formatCurrency(product.price - product.discountPrice) })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-dark-500" />
              {isOutOfStock ? (
                <span className="text-red-400 font-medium">{t('productDetail.outOfStock')}</span>
              ) : (
                <span className="text-dark-300 font-medium">
                  {t('productDetail.inStock', { count: product.stock })}
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-dark-800">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {isOutOfStock ? t('productDetail.outOfStock') : t('productDetail.addToCart')}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection
        productId={product.id}
        ratingAverage={product.ratingAverage}
        ratingCount={product.ratingCount}
      />

      {/* Related Products */}
      <RelatedProducts
        categoryId={product.categoryId}
        currentProductId={product.id}
      />
    </div>
  );
}
