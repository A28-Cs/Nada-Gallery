import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCartItems, updateCartItemQuantity, removeCartItem } from '../../services/cartService';
import { getProductById } from '../../services/productService';
import { CartItem } from '../../types/cart';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PLACEHOLDER_IMAGE, SHIPPING_COST } from '../../config/constants';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) loadCart();
  }, [currentUser]);

  const loadCart = async () => {
    if (!currentUser) return;
    try {
      const cartItems = await getCartItems(currentUser.uid);
      setItems(cartItems);
    } catch (err: any) {
      console.error(t('toast.failedToLoadCart'), err);
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyCartAccess'));
        navigate('/verify-email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (!currentUser) return;
    try {
      // Check stock
      const product = await getProductById(productId);
      if (product && newQty > product.stock) {
        toast.error(t('toast.onlyStockAvailable', { count: product.stock }));
        return;
      }
      await updateCartItemQuantity(currentUser.uid, productId, newQty);
      setItems((prev) =>
        newQty <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) =>
              i.productId === productId ? { ...i, quantity: newQty } : i
            )
      );
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyCartUpdate'));
        navigate('/verify-email');
      } else {
        toast.error(t('toast.failedToUpdateQuantity'));
      }
    }
  };

  const handleRemove = async (productId: string) => {
    if (!currentUser) return;
    try {
      await removeCartItem(currentUser.uid, productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success(t('toast.itemRemoved'));
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyCartUpdate'));
        navigate('/verify-email');
      } else {
        toast.error(t('toast.failedToRemoveItem'));
      }
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (items.length > 0 ? SHIPPING_COST : 0);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-light tracking-wide uppercase text-white mb-8">{t('cartPage.title')}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t('cartPage.emptyTitle')}
          description={t('cartPage.emptyDescription')}
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all"
            >
              {t('common.browseProducts')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 p-4 bg-dark-900 border border-dark-800 rounded-none"
              >
                <div className="w-24 h-24 rounded-none overflow-hidden bg-dark-800 flex-shrink-0">
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={getLocalizedName(item, i18n.language)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium uppercase tracking-wide text-white truncate">{getLocalizedName(item, i18n.language)}</h3>
                  <p className="text-dark-300 font-light mt-1">
                    {formatCurrency(item.price)}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-dark-700 rounded-none">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.productId, item.quantity - 1)
                        }
                        className="p-1.5 text-dark-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.productId, item.quantity + 1)
                        }
                        className="p-1.5 text-dark-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="p-1.5 text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-end">
                  <p className="font-semibold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-900 border border-dark-800 rounded-none p-6 sticky top-24">
              <h2 className="text-lg font-medium tracking-wide uppercase text-white mb-6">
                {t('cartPage.orderSummary')}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-dark-400">
                  <span>{t('cartPage.subtotalItems', { count: items.length })}</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-dark-400">
                  <span>{t('common.shipping')}</span>
                  <span className="text-white">{formatCurrency(SHIPPING_COST)}</span>
                </div>
                <div className="border-t border-dark-700 pt-3 flex justify-between">
                  <span className="font-semibold text-white">{t('common.total')}</span>
                  <span className="text-lg font-bold text-white">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-8 py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all shadow-xl"
              >
                {t('cartPage.proceedToCheckout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
