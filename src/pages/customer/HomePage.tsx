import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveProducts, getFeaturedProducts } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import { addToCart } from '../../services/cartService';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PLACEHOLDER_CATEGORY_IMAGE } from '../../config/constants';
import {
  Search,
  Flower2,
  Star,
  Truck,
  Shield,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Heart,
  Gift,
  Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { currentUser, needsEmailVerification, userProfile } = useAuth();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [featured, active, cats] = await Promise.all([
        getFeaturedProducts(),
        getActiveProducts(),
        getAllCategories(),
      ]);
      setFeaturedProducts(featured);
      setLatestProducts(active);
      setCategories(cats);
    } catch (err) {
      console.error(t('toast.failedToLoad'), err);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredProducts = latestProducts
    .filter((p) => {
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = a.discountPrice > 0 && a.discountPrice < a.price ? a.discountPrice : a.price;
      const priceB = b.discountPrice > 0 && b.discountPrice < b.price ? b.discountPrice : b.price;
      if (sortBy === 'low') return priceA - priceB;
      if (sortBy === 'high') return priceB - priceA;
      return 0;
    })
    .slice(0, 8);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-dark-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/60 via-dark-950/40 to-dark-950/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900/80 backdrop-blur-md border border-dark-700 rounded-full mb-8">
              <Star className="w-4 h-4 text-astro-400" />
              <span className="text-sm font-medium text-astro-400 uppercase tracking-widest">
                {t('homePage.badge')}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
              {t('homePage.titlePrefix')}
              <span className="font-medium italic text-dark-300">
                {' '}{t('homePage.titleHighlight')}{' '}
              </span>
              {t('homePage.titleSuffix')}
            </h1>
            <p className="text-lg text-dark-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              {t('homePage.subtitle')}
            </p>
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
              <Search className="absolute start-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('homePage.searchPlaceholder')}
                className="w-full ps-14 pe-36 py-4 bg-dark-900/80 backdrop-blur-md border border-dark-700 hover:border-dark-600 rounded-full text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-astro-500 transition-all shadow-xl"
              />
              <button
                type="submit"
                className="absolute end-2 top-1/2 -translate-y-1/2 px-8 py-3 bg-white text-dark-950 text-sm font-medium uppercase tracking-widest rounded-full hover:bg-dark-200 transition-all"
              >
                {t('common.search')}
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-10 text-sm text-dark-400 uppercase tracking-wider font-medium">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-dark-300" />
                <span>{t('homePage.fastDelivery')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-dark-300" />
                <span>{t('homePage.securePayments')}</span>
              </div>
              <div className="flex items-center gap-3">
              <Flower2 className="w-5 h-5 text-dark-300" />
                <span>{t('homePage.latestTech')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light tracking-wide uppercase text-white">{t('homePage.shopByCategory')}</h2>
              <p className="text-dark-400 mt-1">{t('homePage.browseCollection')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group relative overflow-hidden rounded-none bg-dark-900 transition-all"
              >
                <div className="aspect-[4/3] bg-dark-800">
                  <img
                    src={cat.image || PLACEHOLDER_CATEGORY_IMAGE}
                    alt={getLocalizedName(cat, i18n.language)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY_IMAGE;
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white group-hover:text-astro-400 transition-colors">
                    {getLocalizedName(cat, i18n.language)}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-light text-white flex items-center gap-3">
              <Flower2 className="w-6 h-6 text-astro-400" />
                {t('homePage.featuredProducts')}
              </h2>
              <p className="text-dark-400 mt-1">{t('homePage.featuredSubtitle')}</p>
            </div>
            <Link
              to="/products"
              className="flex items-center gap-1 text-sm font-medium text-astro-400 hover:text-astro-300 transition-colors"
            >
              {t('common.viewAll')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Latest Products with Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-light text-white">{t('homePage.latestProducts')}</h2>
            <p className="text-dark-400 mt-1">{t('homePage.latestSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none ps-4 pe-10 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 cursor-pointer"
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
                className="appearance-none ps-4 pe-10 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 cursor-pointer"
              >
                <option value="">{t('productsPage.sortBy')}</option>
                <option value="low">{t('productsPage.priceLowHigh')}</option>
                <option value="high">{t('productsPage.priceHighLow')}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-dark-400">{t('homePage.noProductsFound')}</p>
          </div>
        )}
        {latestProducts.length > 8 && (
          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-dark-800 border border-dark-700 text-white font-medium rounded-xl hover:bg-dark-700 transition-all"
            >
              {t('common.viewAllProducts')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
