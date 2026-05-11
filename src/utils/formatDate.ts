import { Timestamp } from 'firebase/firestore';
import i18n from '../i18n';

export function formatDate(timestamp: Timestamp | undefined | null): string {
  if (!timestamp) return i18n.t('common.notAvailable');
  try {
    const date = timestamp.toDate();
    const lang = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return i18n.t('common.notAvailable');
  }
}

export function formatShortDate(timestamp: Timestamp | undefined | null): string {
  if (!timestamp) return i18n.t('common.notAvailable');
  try {
    const date = timestamp.toDate();
    const lang = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return i18n.t('common.notAvailable');
  }
}

export function formatRelativeDate(timestamp: Timestamp | undefined | null): string {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate();
    const lang = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return i18n.language?.startsWith('ar') ? 'الآن' : 'Just now';
        return i18n.language?.startsWith('ar') ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
      }
      return i18n.language?.startsWith('ar') ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return i18n.language?.startsWith('ar') ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    }

    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}
