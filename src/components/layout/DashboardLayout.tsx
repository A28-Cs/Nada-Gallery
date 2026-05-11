import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  LogOut,
  Menu,
  X,
  Flower2,
  Home,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../common/ThemeToggle';

const getSidebarLinks = (t: any) => [
  { to: '/admin', icon: LayoutDashboard, label: t('admin.overview'), exact: true },
  { to: '/admin/products', icon: Package, label: t('admin.products') },
  { to: '/admin/categories', icon: FolderTree, label: t('admin.categories') },
  { to: '/admin/orders', icon: ShoppingBag, label: t('admin.orders') },
  { to: '/admin/users', icon: Users, label: t('admin.users') },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarLinks = getSidebarLinks(t);
  const isRTL = i18n.language.startsWith('ar');

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success(t('toast.logoutSuccess'));
      navigate('/');
    } catch {
      toast.error(t('toast.logoutFailed'));
    }
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-900 border-r rtl:border-l rtl:border-r-0 border-dark-800 fixed inset-y-0 start-0 z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-800">
          <div className="w-8 h-8 rounded-full border border-dark-700 flex items-center justify-center">
            <Flower2 className="w-4 h-4 text-astro-500" />
          </div>
          <span className="text-lg font-display italic text-white tracking-wide">
            Nada Gallery
          </span>
          <span className="text-xs text-dark-500 ms-1">{t('admin.admin')}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = isActive(link.to, link.exact);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all ${
                  active
                    ? 'bg-dark-800 text-white border-l-2 border-astro-500'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
                {active && <ChevronRight className={`w-4 h-4 ${isRTL ? 'mr-auto rotate-180' : 'ml-auto'}`} />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-dark-800">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-dark-400 hover:text-white hover:bg-dark-800/50 transition-all"
          >
            <Home className="w-5 h-5" />
            {t('common.backToStore')}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-none text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all mt-1"
          >
            <LogOut className="w-5 h-5" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-64 bg-dark-900 h-full border-r border-dark-800 animate-slide-down">
            <div className="h-16 flex items-center justify-between px-6 border-b border-dark-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-dark-700 flex items-center justify-center">
                  <Flower2 className="w-4 h-4 text-astro-500" />
                </div>
                <span className="text-lg font-display italic text-white tracking-wide">Nada Gallery</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {sidebarLinks.map((link) => {
                const active = isActive(link.to, link.exact);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-all ${
                      active
                        ? 'bg-dark-800 text-white border-l-2 border-astro-500'
                        : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 start-0 end-0 p-3 border-t border-dark-800">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-dark-400 hover:text-white hover:bg-dark-800/50 transition-all"
              >
                <Home className="w-5 h-5" />
                {t('common.backToStore')}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-none text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all mt-1"
              >
                <LogOut className="w-5 h-5" />
                {t('common.logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ms-64">
        {/* Top bar */}
        <header className="h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-dark-400 hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-dark-300">{t('admin.dashboard')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <p className="text-sm font-medium text-white">{userProfile?.name}</p>
                <p className="text-xs text-dark-500">{userProfile?.email}</p>
              </div>
              <div className="w-9 h-9 rounded-none border border-dark-700 bg-dark-900 flex items-center justify-center text-white text-sm font-medium uppercase">
                {userProfile?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
