import { useTranslation } from 'react-i18next';

export default function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-dark-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-astro-500 animate-spin"></div>
        </div>
        <h2 className="text-xl font-display italic text-white tracking-wide">
          Nada Gallery
        </h2>
        <p className="text-dark-400 text-sm mt-1">{t('common.loading')}</p>
      </div>
    </div>
  );
}
