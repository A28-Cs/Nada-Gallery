import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  LayoutDashboard,
  Flower2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../common/ThemeToggle';

export default function Navbar() {
  const { t } = useTranslation();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success(t('toast.logoutSuccess'));
      navigate('/');
    } catch {
      toast.error(t('toast.logoutFailed'));
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-astro-500" />
            </div>
            <span className="text-xl font-display italic text-white tracking-wide">
              Nada Gallery
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
            >
              {t('common.home')}
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
            >
              {t('common.products')}
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {currentUser ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-astro-400 hover:text-astro-300 hover:bg-astro-500/10 rounded-lg transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('admin.dashboard')}
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="relative p-2 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Link>
                <Link
                  to="/orders"
                  className="p-2 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <Package className="w-5 h-5" />
                </Link>
                <Link
                  to="/profile"
                  className="p-2 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <User className="w-5 h-5" />
                </Link>
                <div className="w-px h-6 bg-dark-700 mx-1"></div>
                <span className="text-sm text-dark-400 max-w-[120px] truncate">
                  {userProfile?.name || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-medium bg-white text-dark-950 hover:bg-dark-200 transition-all rounded-none uppercase tracking-wide"
                >
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-dark-300 hover:text-white rounded-lg"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-800 bg-dark-950/95 backdrop-blur-xl animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
            >
              {t('common.home')}
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
            >
              {t('common.products')}
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <ShoppingCart className="w-5 h-5" /> {t('common.cart')}
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <Package className="w-5 h-5" /> {t('common.orders')}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  <User className="w-5 h-5" /> {t('common.profile')}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-astro-400 hover:text-astro-300 hover:bg-astro-500/10 rounded-lg transition-all"
                  >
                    <LayoutDashboard className="w-5 h-5" /> {t('admin.dashboard')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <LogOut className="w-5 h-5" /> {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-astro-400 hover:text-astro-300 hover:bg-astro-500/10 rounded-lg transition-all"
                >
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
