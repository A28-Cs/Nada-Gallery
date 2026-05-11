import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resendVerificationEmail, checkEmailVerification, logoutUser } from '../../services/authService';
import { Flower2, Mail, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const { currentUser, needsEmailVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const getVerificationErrorToast = (err: any, fallbackKey: string) => {
    if (err?.code === 'auth/too-many-requests') return t('firebaseErrors.tooManyRequests');
    if (err?.code === 'auth/network-request-failed') return t('firebaseErrors.networkError');
    if (err?.code === 'permission-denied') return t('firebaseErrors.permissionDenied');
    return t(fallbackKey);
  };

  // Start cooldown timer
  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const result = await resendVerificationEmail();
      if (result === 'already-verified') {
        try {
          await refreshProfile();
        } catch {
          // Not critical
        }
        toast.success(t('toast.emailVerified'));
        navigate('/');
        return;
      }
      toast.success(t('toast.verificationEmailSent'));
      startCooldown();
    } catch (err: any) {
      console.error('[VerifyEmailPage] Resend error:', err);
      if (err?.code === 'auth/too-many-requests' || err?.message?.includes('too-many-requests')) {
        toast(t('toast.tooManyRequests'), { icon: '⏳' });
        startCooldown();
      } else {
        toast.error(getVerificationErrorToast(err, 'toast.failedVerificationEmail'));
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        try {
          await refreshProfile();
        } catch {
          // Profile refresh failed — not critical, proceed anyway
        }
        toast.success(t('toast.emailVerified'));
        navigate('/');
      } else {
        toast.error(t('toast.emailStillNotVerified'));
      }
    } catch (err: any) {
      console.error(err);
      // If rate-limited at ANY level, show a gentle wait message
      if (err?.code === 'auth/too-many-requests' || err?.message?.includes('too-many-requests')) {
        toast(t('toast.tooManyRequests'), { icon: '⏳' });
      } else {
        toast.error(getVerificationErrorToast(err, 'toast.failedVerificationCheck'));
      }
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success(t('toast.logoutSuccess'));
      navigate('/login');
    } catch {
      toast.error(t('toast.logoutFailed'));
    }
  };

  // If user is already verified or not logged in, redirect
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  if (!needsEmailVerification) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 end-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full border border-dark-700 flex items-center justify-center mx-auto mb-6">
            <Flower2 className="w-8 h-8 text-astro-500" />
          </div>
          <h1 className="text-3xl font-light tracking-widest uppercase text-white">{t('verifyEmailPage.title')}</h1>
          <p className="text-dark-400 mt-2">{t('verifyEmailPage.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-none p-8 space-y-8">
          {/* Email icon + info */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">
                {t('verifyEmailPage.sentTo')}
              </p>
              <p className="text-astro-400 font-semibold mt-1">
                {currentUser.email}
              </p>
            </div>
            <div className="bg-dark-950 rounded-none p-4 border border-dark-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-astro-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-300 text-start">
                  {t('verifyEmailPage.instructions')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Check Verification */}
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {checking ? t('verifyEmailPage.checking') : t('verifyEmailPage.verifiedButton')}
            </button>

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full flex items-center justify-center gap-3 py-4 bg-dark-950 text-white font-medium uppercase tracking-widest rounded-none hover:bg-dark-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-dark-700"
            >
              {resending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {resending
                ? t('verifyEmailPage.sending')
                : cooldown > 0
                ? t('verifyEmailPage.resendIn', { count: cooldown })
                : t('verifyEmailPage.resend')}
            </button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-700"></div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 text-dark-400 hover:text-red-400 font-medium uppercase tracking-widest rounded-none transition-all border border-dark-800 hover:border-red-500/50"
            >
              <LogOut className="w-4 h-4" />
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
