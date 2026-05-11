import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCartItems, clearCart } from '../../services/cartService';
import { getProductById } from '../../services/productService';
import { createOrder } from '../../services/orderService';
import { CartItem } from '../../types/cart';
import { ShippingAddress } from '../../types/order';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SHIPPING_COST, PLACEHOLDER_IMAGE } from '../../config/constants';
import { MapPin, CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied, getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile, needsEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (currentUser) loadCart();
  }, [currentUser]);

  useEffect(() => {
    if (userProfile) {
      setAddress((prev) => ({
        ...prev,
        name: prev.name || userProfile.name || '',
        phone: prev.phone || userProfile.phone || '',
      }));
    }
  }, [userProfile]);

  const loadCart = async () => {
    if (!currentUser) return;
    try {
      const cartItems = await getCartItems(currentUser.uid);
      if (cartItems.length === 0) {
        toast.error(t('toast.cartEmpty'));
        navigate('/cart');
        return;
      }
      setItems(cartItems);
    } catch (err: any) {
      console.error(t('toast.failedToLoadCart'), err);
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyCartAccess'));
        navigate('/verify-email');
      } else {
        toast.error(t('toast.failedToLoadCart'));
      }
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  const handlePlaceOrder = async () => {
    if (!currentUser) return;

    // Email verification check
    if (needsEmailVerification) {
      toast.error(t('toast.verifyBeforeOrders'));
      navigate('/verify-email');
      return;
    }

    // Account status checks
    if (userProfile?.status === 'blocked') {
      toast.error(t('validation.accountBlockedContact'));
      return;
    }
    if (userProfile?.status === 'pending_verification') {
      toast.error(t('toast.verifyBeforeOrders'));
      navigate('/verify-email');
      return;
    }

    // Validate
    if (!address.name || !address.phone || !address.city || !address.address) {
      toast.error(t('validation.fillShippingDetails'));
      return;
    }

    setPlacing(true);
    try {
      // Validate stock
      for (const item of items) {
        const product = await getProductById(item.productId);
        const itemName = getLocalizedName(item, i18n.language);
        if (!product || product.status !== 'active') {
          toast.error(t('toast.productUnavailable', { name: itemName }));
          setPlacing(false);
          return;
        }
        if (product.stock < item.quantity) {
          toast.error(t('toast.productStockLeft', { name: itemName, count: product.stock }));
          setPlacing(false);
          return;
        }
      }

      await createOrder(currentUser.uid, items, address);
      await clearCart(currentUser.uid);
      toast.success(t('toast.orderPlaced'));
      navigate('/orders');
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyPlaceOrders'));
        navigate('/verify-email');
      } else {
        toast.error(getFirebaseErrorMessage(err) || t('toast.failedToPlaceOrder'));
      }
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-light tracking-wide uppercase text-white mb-8">{t('checkoutPage.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-900 border border-dark-800 rounded-none p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-none border border-dark-700 bg-dark-950 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-astro-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{t('checkoutPage.shippingAddress')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  {t('checkoutPage.fullNameRequired')}
                </label>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                  placeholder={t('checkoutPage.namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  {t('checkoutPage.phoneRequired')}
                </label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                  placeholder={t('checkoutPage.phonePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  {t('checkoutPage.cityRequired')}
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                  placeholder={t('checkoutPage.cityPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  {t('checkoutPage.fullAddressRequired')}
                </label>
                <input
                  type="text"
                  value={address.address}
                  onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                  placeholder={t('checkoutPage.addressPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-none p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-none border border-dark-700 bg-dark-950 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-astro-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">{t('checkoutPage.paymentMethod')}</h2>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-dark-950 border border-astro-500/30 rounded-none">
              <CheckCircle className="w-5 h-5 text-astro-400" />
              <span className="text-white font-medium">{t('checkoutPage.cashOnDelivery')}</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-dark-900 border border-dark-800 rounded-none p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t('checkoutPage.orderSummary')}
            </h2>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-none overflow-hidden bg-dark-800 flex-shrink-0">
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
                    <p className="text-sm text-white truncate">{getLocalizedName(item, i18n.language)}</p>
                    <p className="text-xs text-dark-400">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm border-t border-dark-700 pt-4">
              <div className="flex justify-between text-dark-400">
                <span>{t('common.subtotal')}</span>
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
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-6 py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? t('checkoutPage.placingOrder') : t('checkoutPage.placeOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
