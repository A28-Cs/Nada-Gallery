import { useState, useEffect } from 'react';
import { getAllUsers, updateUserStatus, updateUserRole } from '../../services/userService';
import { UserProfile } from '../../types/user';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Users, Shield, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function UsersManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => { try { setUsers(await getAllUsers()); } catch { toast.error(t('toast.failedToLoad')); } finally { setLoading(false); } };

  const handleStatusToggle = async (u: UserProfile) => {
    const s = u.status === 'active' ? 'blocked' : 'active';
    try { await updateUserStatus(u.id, s); toast.success(t('toast.userStatusChanged', { status: t(`status.${s}`) })); await load(); }
    catch { toast.error(t('toast.failedToSave')); }
  };

  const handleRoleToggle = async (u: UserProfile) => {
    const r = u.role === 'admin' ? 'customer' : 'admin';
    if (!confirm(t('toast.changeRoleConfirm', { role: t(`status.${r}`) }))) return;
    try { await updateUserRole(u.id, r); toast.success(t('toast.roleUpdated')); await load(); }
    catch { toast.error(t('toast.failedToSave')); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">{t('admin.users')}</h1>
      {users.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.noUsers')} description={t('admin.noUsersDescription')} />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-800">
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('admin.users')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden md:table-cell">{t('common.phone')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.role')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.status')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden lg:table-cell">{t('admin.joined')}</th>
                <th className="text-end px-4 py-3 text-dark-400 font-medium">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-3"><p className="font-medium text-white">{u.name || t('common.notAvailable')}</p><p className="text-xs text-dark-400">{u.email}</p></td>
                    <td className="px-4 py-3 text-dark-300 hidden md:table-cell">{u.phone || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-lg ${u.role === 'admin' ? 'bg-astro-500/10 text-astro-400' : 'bg-dark-800 text-dark-300'}`}>{t(`status.${u.role}`)}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-lg ${u.status === 'active' ? 'bg-astro-500/10 text-astro-400' : 'bg-dark-800 text-dark-300'}`}>{t(`status.${u.status}`)}</span></td>
                    <td className="px-4 py-3 text-dark-400 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleRoleToggle(u)} className="p-1.5 text-dark-500 hover:text-astro-400 hover:bg-astro-500/10 rounded-lg transition-colors" title={t('admin.toggleRole')}><Shield className="w-4 h-4" /></button>
                        <button onClick={() => handleStatusToggle(u)} className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'text-dark-500 hover:text-red-400 hover:bg-red-500/10' : 'text-dark-500 hover:text-astro-400 hover:bg-astro-500/10'}`} title={t('admin.toggleStatus')}><Ban className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
