import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveProducts } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import { addToCart } from '../../services/cartService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Search, Package, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedDescription, getLocalizedName } from '../../utils/localizedContent';

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const { currentUser, needsEmailVerification, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        getActiveProducts(),
        getAllCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(t('toast.failedToLoadProducts'), err);
      toast.error(t('toast.failedToLoadProducts'));
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
        toast.error(err.message === 'cart/max-stock' ? t('toast.cannotExceedStock') : err.message || t('toast.failedToAddToCart'));
      }
    }
  };

  const filtered = products
    .filter((p) => {
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = getLocalizedName(p, i18n.language).toLowerCase();
        const description = getLocalizedDescription(p, i18n.language).toLowerCase();
        return name.includes(q) || description.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = a.discountPrice > 0 && a.discountPrice < a.price ? a.discountPrice : a.price;
      const priceB = b.discountPrice > 0 && b.discountPrice < b.price ? b.discountPrice : b.price;
      if (sortBy === 'low') return priceA - priceB;
      if (sortBy === 'high') return priceB - priceA;
      return 0;
    });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-light tracking-wide uppercase text-white">{t('productsPage.title')}</h1>
        <p className="text-dark-400 mt-1">
          {t('productsPage.resultsCount', {
            count: filtered.length,
            plural: filtered.length !== 1 ? 's' : '',
          })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('productsPage.searchPlaceholder')}
            className="w-full ps-12 pe-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-astro-500 focus:border-astro-500 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none w-full sm:w-48 ps-4 pe-10 py-3 bg-dark-950 border border-dark-700 rounded-none text-sm text-white focus:outline-none focus:ring-1 focus:ring-astro-500 cursor-pointer"
          >
            <option value="">{t('productsPage.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getLocalizedName(cat, i18n.language)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none w-full sm:w-48 ps-4 pe-10 py-3 bg-dark-950 border border-dark-700 rounded-none text-sm text-white focus:outline-none focus:ring-1 focus:ring-astro-500 cursor-pointer"
          >
            <option value="">{t('productsPage.sortBy')}</option>
            <option value="low">{t('productsPage.priceLowHigh')}</option>
            <option value="high">{t('productsPage.priceHighLow')}</option>
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t('productsPage.emptyTitle')}
          description={t('productsPage.emptyDescription')}
        />
      )}
    </div>
  );
}
