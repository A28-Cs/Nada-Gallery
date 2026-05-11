import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders } from '../../services/orderService';
import { Order } from '../../types/order';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PLACEHOLDER_IMAGE } from '../../config/constants';
import { ShoppingBag, ChevronDown, ChevronUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

const statusColors: Record<string, string> = {
  pending: 'bg-dark-800 text-dark-300 border-dark-700',
  confirmed: 'bg-dark-800 text-dark-300 border-dark-700',
  shipped: 'bg-dark-800 text-dark-300 border-dark-700',
  delivered: 'bg-astro-500/10 text-astro-400 border-astro-500/20',
  cancelled: 'bg-dark-800 text-dark-300 border-dark-700',
};

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      const data = await getUserOrders(currentUser.uid);
      setOrders(data);
    } catch (err: any) {
      console.error(err);
      if (isPermissionDenied(err)) {
        toast.error(t('toast.verifyOrdersAccess'));
      } else {
        toast.error(t('toast.failedToLoadOrders'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-light tracking-wide uppercase text-white mb-8">{t('ordersPage.title')}</h1>
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('ordersPage.emptyTitle')} description={t('ordersPage.emptyDescription')} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-dark-900 border border-dark-800 rounded-none overflow-hidden">
              <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="w-full flex items-center justify-between p-5 hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-none bg-dark-950 border border-dark-700 flex items-center justify-center"><Package className="w-5 h-5 text-dark-400" /></div>
                  <div className="text-start">
                    <p className="text-sm font-medium text-white">{t('ordersPage.orderNumber', { id: order.id.slice(-8).toUpperCase() })}</p>
                    <p className="text-xs text-dark-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 text-xs font-medium uppercase tracking-widest rounded-none border ${statusColors[order.status] || ''}`}>{t(`status.${order.status}`)}</span>
                  <span className="text-sm font-bold text-white hidden sm:block">{formatCurrency(order.total)}</span>
                  {expandedOrder === order.id ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
                </div>
              </button>
              {expandedOrder === order.id && (
                <div className="border-t border-dark-800 p-5 animate-slide-down">
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-none overflow-hidden bg-dark-800 flex-shrink-0">
                          <img src={item.image || PLACEHOLDER_IMAGE} alt={getLocalizedName(item, i18n.language)} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{getLocalizedName(item, i18n.language)}</p>
                          <p className="text-xs text-dark-400">{item.quantity} × {formatCurrency(item.price)}</p>
                        </div>
                        <span className="text-sm font-medium text-white">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dark-700 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-dark-400"><span>{t('common.subtotal')}</span><span>{formatCurrency(order.subtotal)}</span></div>
                    <div className="flex justify-between text-dark-400"><span>{t('common.shipping')}</span><span>{formatCurrency(order.shipping)}</span></div>
                    <div className="flex justify-between font-bold text-white pt-2 border-t border-dark-700"><span>{t('common.total')}</span><span>{formatCurrency(order.total)}</span></div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-dark-500 mb-1">{t('ordersPage.shipTo')}</p><p className="text-white">{order.shippingAddress.name}, {order.shippingAddress.city}</p></div>
                    <div><p className="text-xs text-dark-500 mb-1">{t('common.phone')}</p><p className="text-white">{order.shippingAddress.phone}</p></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
