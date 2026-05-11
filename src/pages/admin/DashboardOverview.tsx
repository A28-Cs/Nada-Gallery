import { useState, useEffect } from 'react';
import { getAllProducts } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import { getAllOrders } from '../../services/orderService';
import { getAllUsers } from '../../services/userService';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, FolderTree, Users, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DashboardOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ products: 0, categories: 0, users: 0, orders: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [products, categories, orders, users] = await Promise.all([getAllProducts(), getAllCategories(), getAllOrders(), getAllUsers()]);
      const pending = orders.filter(o => o.status === 'pending').length;
      const revenue = orders.filter(o => o.status === 'delivered' || o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
      setStats({ products: products.length, categories: categories.length, users: users.length, orders: orders.length, pending, revenue });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const cards = [
    { label: t('admin.totalProducts'), value: stats.products, icon: Package },
    { label: t('admin.totalCategories'), value: stats.categories, icon: FolderTree },
    { label: t('admin.totalUsers'), value: stats.users, icon: Users },
    { label: t('admin.totalOrders'), value: stats.orders, icon: ShoppingBag },
    { label: t('admin.pendingOrders'), value: stats.pending, icon: Clock },
    { label: t('admin.revenue'), value: formatCurrency(stats.revenue), icon: DollarSign },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">{t('admin.dashboardOverview')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-dark-900 border border-dark-800 rounded-2xl p-6 hover:border-dark-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center"><c.icon className="w-6 h-6 text-astro-400" /></div>
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-dark-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
