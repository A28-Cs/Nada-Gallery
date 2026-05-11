import { Flower2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';

export default function Footer() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full border border-dark-700 flex items-center justify-center">
                <Flower2 className="w-4 h-4 text-astro-500" />
              </div>
              <span className="text-lg font-display italic text-white tracking-wide">
                Nada Gallery
              </span>
            </div>
            <p className="text-dark-400 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              {t('footer.quickLinks')}
            </h3>
            <div className="space-y-3">
              <Link to="/" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                {t('common.home')}
              </Link>
              <Link to="/products" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                {t('common.products')}
              </Link>
              <Link to="/cart" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                {t('common.cart')}
              </Link>
              <Link to="/orders" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                {t('ordersPage.title')}
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              {t('footer.account')}
            </h3>
            <div className="space-y-3">
              {currentUser ? (
                <>
                  <Link to="/profile" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                    {t('common.myProfile')}
                  </Link>
                  <Link to="/orders" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                    {t('common.orders')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block text-sm text-dark-400 hover:text-red-400 transition-colors"
                  >
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                    {t('common.login')}
                  </Link>
                  <Link to="/register" className="block text-sm text-dark-400 hover:text-astro-400 transition-colors">
                    {t('common.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-dark-800 text-center">
          <p className="text-sm text-dark-500">
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
