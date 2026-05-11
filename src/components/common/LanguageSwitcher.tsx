import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800/70 rounded-xl transition-all ${className}`}
      aria-label={t('language.toggle')}
    >
      <Globe className="h-5 w-5" />
      <span>{isArabic ? t('language.switchToEnglish') : t('language.switchToArabic')}</span>
    </button>
  );
}
