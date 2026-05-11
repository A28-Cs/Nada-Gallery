import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/userService';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPermissionDenied, getFirebaseErrorMessage } from '../../utils/firebaseErrors';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { userProfile, refreshProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      await updateUserProfile(userProfile.id, { name, phone, address });
      await refreshProfile();
      toast.success(t('profilePage.profileUpdated'));
    } catch (err: any) { 
      if (isPermissionDenied(err)) {
        toast.error(t('toast.permissionDenied'));
      } else {
        toast.error(getFirebaseErrorMessage(err) || t('toast.failedToSave'));
      }
    }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-light tracking-wide uppercase text-white mb-8">{t('profilePage.title')}</h1>
      <div className="bg-dark-900 border border-dark-800 rounded-none p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-none bg-dark-950 border border-dark-700 flex items-center justify-center text-white text-2xl font-light uppercase">
            {userProfile?.name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
          </div>
          <div><p className="text-lg font-medium text-white tracking-wide">{userProfile?.name}</p><p className="text-dark-400 text-sm">{userProfile?.email}</p></div>
        </div>
      </div>
      <div className="bg-dark-900 border border-dark-800 rounded-none p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium uppercase tracking-widest text-white">{t('language.preferenceTitle')}</h2>
            <p className="text-sm text-dark-400 mt-1">{t('profilePage.languageHelp')}</p>
          </div>
          <LanguageSwitcher className="bg-dark-950 border border-dark-700 rounded-none hover:border-astro-500/40" />
        </div>
      </div>
      <div className="bg-dark-900 border border-dark-800 rounded-none p-6">
        <h2 className="text-lg font-medium uppercase tracking-widest text-white mb-4">{t('profilePage.accountDetails')}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">{t('common.name')}</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white focus:outline-none focus:ring-1 focus:ring-astro-500 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">{t('common.email')}</label><input type="email" value={userProfile?.email || ''} disabled className="w-full px-4 py-3 bg-dark-950/50 border border-dark-700 rounded-none text-dark-400 cursor-not-allowed" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">{t('common.phone')}</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white focus:outline-none focus:ring-1 focus:ring-astro-500 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">{t('common.address')}</label><textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white focus:outline-none focus:ring-1 focus:ring-astro-500 transition-all resize-none" /></div>
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 mt-4 bg-white text-dark-950 font-medium uppercase tracking-widest rounded-none hover:bg-dark-200 transition-all disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? t('common.saving') : t('common.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
