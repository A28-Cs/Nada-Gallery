import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRelatedProducts } from '../../services/productService';
import { addToCart } from '../../services/cartService';
import { Product } from '../../types/product';
import ProductCard from './ProductCard';
import { Flower2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

export default function RelatedProducts({
  categoryId,
  currentProductId,
}: RelatedProductsProps) {
  const { t, i18n } = useTranslation();
  const { currentUser, needsEmailVerification, userProfile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelated();
  }, [categoryId, currentProductId]);

  const loadRelated = async () => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getRelatedProducts(categoryId, currentProductId, 8);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load related products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
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
    try {
      await addToCart(currentUser.uid, product);
      toast.success(t('toast.productAddedToCart', { name: getLocalizedName(product, i18n.language) }));
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyBeforeCart'));
        navigate('/verify-email');
      } else {
        toast.error(
          err.message === 'cart/max-stock'
            ? t('toast.cannotExceedStock')
            : err.message || t('toast.failedToAddToCart')
        );
      }
    }
  };

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div className="mt-24 pt-16 border-t border-dark-800/50 animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-12 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-dark-900 border border-dark-700 rounded-none mb-6">
          <Flower2 className="w-6 h-6 text-astro-400" />
        </div>
        <h2 className="text-3xl font-light tracking-wide uppercase text-white">{t('reviews.relatedProducts')}</h2>
        <div className="w-12 h-0.5 bg-dark-700 mt-6"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
