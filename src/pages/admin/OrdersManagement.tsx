import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, updatePaymentStatus } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types/order';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { PLACEHOLDER_IMAGE, ORDER_STATUSES, PAYMENT_STATUSES } from '../../config/constants';
import { ShoppingBag, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';

const statusColors: Record<string, string> = {
  pending: 'bg-dark-800 text-dark-300',
  confirmed: 'bg-dark-800 text-dark-300',
  shipped: 'bg-dark-800 text-dark-300',
  delivered: 'bg-astro-500/10 text-astro-400',
  cancelled: 'bg-dark-800 text-dark-300',
};

export default function OrdersManagement() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { setOrders(await getAllOrders()); } catch { toast.error(t('toast.failedToLoad')); } finally { setLoading(false); } };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try { await updateOrderStatus(orderId, status); toast.success(t('toast.statusUpdated')); await load(); }
    catch { toast.error(t('toast.failedToSave')); }
  };

  const handlePaymentChange = async (orderId: string, status: PaymentStatus) => {
    try { await updatePaymentStatus(orderId, status); toast.success(t('toast.paymentUpdated')); await load(); }
    catch { toast.error(t('toast.failedToSave')); }
  };

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('admin.orders')}</h1>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 cursor-pointer">
            <option value="">{t('common.filter')}...</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('admin.noOrders')} description={t('admin.noOrdersDescription')} />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-800">
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.order')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden md:table-cell">{t('common.date')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.total')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.status')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden sm:table-cell">{t('common.payment')}</th>
                <th className="text-end px-4 py-3 text-dark-400 font-medium">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-3"><p className="font-medium text-white">#{o.id.slice(-8).toUpperCase()}</p><p className="text-xs text-dark-500">{t('common.itemsCount', { count: o.items?.length || 0 })}</p></td>
                    <td className="px-4 py-3 text-dark-300 hidden md:table-cell">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-white">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value as OrderStatus)} className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:outline-none ${statusColors[o.status] || 'bg-dark-800 text-dark-300'}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <select value={o.paymentStatus} onChange={e => handlePaymentChange(o.id, e.target.value as PaymentStatus)} className="px-2 py-1 text-xs font-medium rounded-lg border-0 bg-dark-800 text-dark-300 cursor-pointer focus:outline-none">
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedOrder(o)} className="p-1.5 text-dark-500 hover:text-astro-400 hover:bg-astro-500/10 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={t('admin.orderTitle', { id: String(selectedOrder?.id || '').slice(-8).toUpperCase() })} maxWidth="max-w-2xl">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-dark-500 mb-1">{t('common.customer')}</p><p className="text-white">{selectedOrder.shippingAddress?.name || t('common.notAvailable')}</p></div>
              <div><p className="text-dark-500 mb-1">{t('common.phone')}</p><p className="text-white">{selectedOrder.shippingAddress?.phone || t('common.notAvailable')}</p></div>
              <div><p className="text-dark-500 mb-1">{t('common.city')}</p><p className="text-white">{selectedOrder.shippingAddress?.city || t('common.notAvailable')}</p></div>
              <div><p className="text-dark-500 mb-1">{t('common.address')}</p><p className="text-white">{selectedOrder.shippingAddress?.address || t('common.notAvailable')}</p></div>
            </div>
            <div className="border-t border-dark-700 pt-4 space-y-3">
              {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item?.image || PLACEHOLDER_IMAGE} alt={getLocalizedName(item, i18n.language) || t('admin.unknownItem')} className="w-10 h-10 rounded-lg object-cover bg-dark-800" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  <div className="flex-1"><p className="text-sm text-white">{getLocalizedName(item, i18n.language) || t('admin.unknownItem')}</p><p className="text-xs text-dark-400">{item?.quantity || 0} × {formatCurrency(item?.price || 0)}</p></div>
                  <span className="text-sm font-medium text-white">{formatCurrency((item?.price || 0) * (item?.quantity || 0))}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-700 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-dark-400"><span>{t('common.subtotal')}</span><span>{formatCurrency(selectedOrder.subtotal || 0)}</span></div>
              <div className="flex justify-between text-dark-400"><span>{t('common.shipping')}</span><span>{formatCurrency(selectedOrder.shipping || 0)}</span></div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-dark-700"><span>{t('common.total')}</span><span>{formatCurrency(selectedOrder.total || 0)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
