import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Flower2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidCode, setInvalidCode] = useState(false);

  // Verify the reset code on mount
  useEffect(() => {
    async function verifyCode() {
      if (!oobCode || mode !== 'resetPassword') {
        setInvalidCode(true);
        setVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err: any) {
        console.error('[ResetPasswordPage] Invalid code:', err);
        setInvalidCode(true);
      } finally {
        setVerifying(false);
      }
    }

    verifyCode();
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(t('validation.fillAllFields'));
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      toast.error(t('validation.strongPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }

    if (!oobCode) {
      toast.error(t('resetPassword.invalidLink'));
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      toast.success(t('resetPassword.success'));
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('[ResetPasswordPage] Error:', err);

      let msg: string;
      switch (err.code) {
        case 'auth/expired-action-code':
          msg = t('resetPassword.expiredCode');
          break;
        case 'auth/invalid-action-code':
          msg = t('resetPassword.invalidCode');
          break;
        case 'auth/weak-password':
          msg = t('firebaseErrors.weakPassword');
          break;
        default:
          msg = t('firebaseErrors.unexpected');
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-none border border-dark-700 flex items-center justify-center mx-auto animate-pulse">
            <Flower2 className="w-8 h-8 text-astro-500" />
          </div>
          <p className="text-dark-400 uppercase tracking-widest text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Invalid / expired code state
  if (invalidCode) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative">
        <div className="absolute top-4 end-4 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-none border border-dark-700 flex items-center justify-center mx-auto mb-6">
              <Flower2 className="w-8 h-8 text-astro-500" />
            </div>
            <h1 className="text-3xl font-light text-white tracking-widest uppercase">
              {t('resetPassword.title')}
            </h1>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-none p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-medium">{t('resetPassword.invalidLink')}</p>
              <p className="text-sm text-dark-400">{t('resetPassword.invalidLinkDescription')}</p>
              <div className="pt-4 space-y-3">
                <Link
                  to="/forgot-password"
                  className="block w-full py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all text-center"
                >
                  {t('resetPassword.requestNewLink')}
                </Link>
                <Link
                  to="/login"
                  className="block w-full py-4 text-dark-400 hover:text-white font-medium uppercase tracking-widest rounded-none transition-all border border-dark-800 hover:border-dark-600 text-center"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-none border border-dark-700 flex items-center justify-center mx-auto mb-6">
            <Flower2 className="w-8 h-8 text-astro-500" />
          </div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">
            {t('resetPassword.title')}
          </h1>
          <p className="text-dark-400 mt-2">{t('resetPassword.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-none p-8 space-y-6">
          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-medium">{t('resetPassword.success')}</p>
              <p className="text-sm text-dark-400">{t('resetPassword.redirecting')}</p>
              <Link
                to="/login"
                className="inline-block mt-2 text-astro-400 hover:text-astro-300 font-medium text-sm transition-colors"
              >
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                {email && (
                  <p className="text-sm text-dark-400">
                    {t('resetPassword.forEmail')} <span className="text-astro-400 font-semibold">{email}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    {t('resetPassword.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all pr-12"
                      placeholder={t('auth.passwordMinPlaceholder')}
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
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">
                    {t('common.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-950 border border-dark-800 rounded-none text-white placeholder-dark-500 focus:outline-none focus:border-astro-500 transition-all"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '...' : t('resetPassword.resetButton')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
