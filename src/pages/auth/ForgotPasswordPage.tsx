import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flower2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';

/**
 * Call the backend /api/send-password-reset-email endpoint.
 * This uses Firebase Admin SDK + Resend on the server side.
 */
async function sendCustomPasswordResetEmail(email: string): Promise<void> {
  const response = await fetch('/api/send-password-reset-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMessage =
      data?.error || `Failed to send password reset email (status ${response.status})`;
    console.error('[sendCustomPasswordResetEmail]', errorMessage);
    throw new Error(errorMessage);
  }
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('validation.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await sendCustomPasswordResetEmail(email);
      setSent(true);
      toast.success(t('forgotPassword.emailSent'));
    } catch (err: any) {
      console.error('[ForgotPasswordPage] Error:', err);
      toast.error(err.message || t('firebaseErrors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full border border-dark-700 flex items-center justify-center mx-auto mb-6">
            <Flower2 className="w-8 h-8 text-astro-500" />
          </div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase">
            {t('forgotPassword.title')}
          </h1>
          <p className="text-dark-400 mt-2">{t('forgotPassword.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-none p-8 space-y-6">
          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">{t('forgotPassword.checkInbox')}</p>
                <p className="text-astro-400 font-semibold mt-1">{email}</p>
              </div>
              <p className="text-sm text-dark-400">{t('forgotPassword.checkSpam')}</p>

              {/* Send again */}
              <button
                onClick={() => setSent(false)}
                className="text-sm text-astro-400 hover:text-astro-300 font-medium transition-colors"
              >
                {t('forgotPassword.sendAgain')}
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-800 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-dark-400">{t('forgotPassword.instructions')}</p>
              </div>

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
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '...' : t('forgotPassword.sendResetLink')}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-astro-400 hover:text-astro-300 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
