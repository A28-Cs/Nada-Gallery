import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/userService';

import { Flower2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('validation.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      toast.success(t('auth.welcomeBack'));
      // Check if admin to redirect properly
      const profile = await getUserProfile(user.uid);
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? t('toast.loginFailed')
        : err.code === 'auth/user-not-found'
        ? t('toast.loginFailed')
        : t('toast.loginFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      toast.success(t('auth.welcome'));
      // Check if admin to redirect properly
      const profile = await getUserProfile(user.uid);
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        toast.error(
          t('firebaseErrors.differentCredential')
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup — no error needed
      } else {
        toast.error(t('auth.googleFailed'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLoading = loading || googleLoading;

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full border border-dark-700 flex items-center justify-center mx-auto mb-6">
            <Flower2 className="w-8 h-8 text-astro-500" />
          </div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">{t('common.login')}</h1>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-none p-8 space-y-6">
          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-dark-950 border border-dark-700 hover:bg-dark-800 text-white font-medium uppercase tracking-wide rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? t('auth.signingIn') : t('auth.continueWithGoogle')}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-dark-900 text-dark-500">{t('auth.orSignInWithEmail')}</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                {t('common.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                {t('common.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all pr-12"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-astro-400 hover:text-astro-300 font-medium transition-colors"
              >
                {t('forgotPassword.link')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : t('common.login')}
            </button>
          </form>
        </div>

        <p className="text-center text-dark-400 text-sm mt-6">
          <Link to="/register" className="text-astro-400 hover:text-astro-300 font-medium">
            {t('common.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
