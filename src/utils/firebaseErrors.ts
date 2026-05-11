import i18n from '../i18n';

/**
 * Maps Firestore/Firebase error codes to localized, user-friendly messages.
 */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';

  switch (code) {
    // Firestore permission errors
    case 'permission-denied':
      return i18n.t('firebaseErrors.permissionDenied');

    // Auth errors
    case 'auth/invalid-credential':
      return i18n.t('firebaseErrors.invalidCredential');
    case 'auth/user-not-found':
      return i18n.t('firebaseErrors.userNotFound');
    case 'auth/email-already-in-use':
      return i18n.t('firebaseErrors.emailAlreadyInUse');
    case 'auth/weak-password':
      return i18n.t('firebaseErrors.weakPassword');
    case 'auth/too-many-requests':
      return i18n.t('firebaseErrors.tooManyRequests');
    case 'auth/account-exists-with-different-credential':
      return i18n.t('firebaseErrors.differentCredential');
    case 'auth/popup-closed-by-user':
      return '';  // Silent — user cancelled intentionally
    case 'auth/network-request-failed':
      return i18n.t('firebaseErrors.networkError');

    default:
      return error?.message || i18n.t('firebaseErrors.unexpected');
  }
}

/**
 * Checks if a Firestore error is a permission-denied error.
 */
export function isPermissionDenied(error: any): boolean {
  return error?.code === 'permission-denied';
}
