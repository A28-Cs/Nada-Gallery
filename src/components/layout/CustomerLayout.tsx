import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { needsEmailVerification } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      {/* Email verification warning banner */}
      {needsEmailVerification && (
        <div className="bg-dark-900 border-b border-dark-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-astro-400 flex-shrink-0" />
              <p className="text-sm text-dark-300 truncate">
                {t('customer.verifyBanner')}
              </p>
            </div>
            <button
              onClick={() => navigate('/verify-email')}
              className="flex-shrink-0 px-3 py-1 text-xs font-semibold bg-dark-800 text-white hover:bg-dark-700 rounded-lg transition-all border border-dark-700"
            >
              {t('customer.verifyNow')}
            </button>
          </div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
