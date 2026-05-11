import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

export type VerificationEmailResult = 'sent' | 'already-verified';

type VerificationEmailApiResponse = {
  success?: boolean;
  alreadyVerified?: boolean;
  error?: string;
};

async function markEmailVerified(user: User): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();
  await updateDoc(userDocRef, {
    emailVerified: true,
    ...(data.status === 'pending_verification' ? { status: 'active' } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Call the backend /api/send-verification-email endpoint.
 * This uses Firebase Admin SDK + Resend on the server side.
 */
async function sendCustomVerificationEmail(
  email: string,
  name?: string
): Promise<VerificationEmailApiResponse> {
  const response = await fetch('/api/send-verification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data?.error || `Failed to send verification email (status ${response.status})`;
    console.error('[sendCustomVerificationEmail]', errorMessage);
    throw new Error(errorMessage);
  }

  return data;
}

async function sendVerificationEmailForUser(
  user: User,
  name?: string
): Promise<VerificationEmailResult> {
  if (!user.email) throw new Error('Current user has no email address');

  try {
    await user.reload();
  } catch (err: any) {
    if (err?.code === 'auth/too-many-requests') {
      // Rate limited — proceed with cached state
    } else {
      throw err;
    }
  }
  const freshUser = auth.currentUser ?? user;
  if (!freshUser.email) throw new Error('Current user has no email address');

  if (freshUser.emailVerified) {
    await markEmailVerified(freshUser);
    return 'already-verified';
  }

  try {
    const result = await sendCustomVerificationEmail(freshUser.email, name);
    if (result.alreadyVerified) {
      await freshUser.reload().catch(() => undefined);
      await markEmailVerified(freshUser);
      return 'already-verified';
    }
    return 'sent';
  } catch (err) {
    console.warn(
      '[sendVerificationEmailForUser] Custom verification email failed; falling back to Firebase email:',
      err
    );
  }

  await sendEmailVerification(freshUser);
  return 'sent';
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create Firestore profile with pending_verification status
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    phone: '',
    address: '',
    role: 'customer',
    status: 'pending_verification',
    photoURL: '',
    authProvider: 'password',
    emailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Send custom branded verification email via backend
  try {
    await sendVerificationEmailForUser(user, name);
  } catch (err) {
    // Log the error but don't block registration — user can resend from verify page
    console.error('[registerUser] Failed to send verification email:', err);
  }

  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // If user has verified their email since last login, update Firestore
  if (user.emailVerified) {
    await markEmailVerified(user);
  }

  return user;
}

export async function signInWithGoogle(): Promise<User> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;

  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    // New Google user — create Firestore profile as active (Google emails are verified)
    await setDoc(userDocRef, {
      name: user.displayName || '',
      email: user.email || '',
      phone: '',
      address: '',
      role: 'customer',
      status: 'active',
      photoURL: user.photoURL || '',
      authProvider: 'google',
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Existing user — update login metadata only.
    // Do NOT overwrite role, name, phone, address, status, etc.
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      authProvider: 'google',
    });
  }

  return user;
}

/**
 * Resend verification email using the custom backend endpoint.
 * Called from the verify-email page.
 */
export async function resendVerificationEmail(): Promise<VerificationEmailResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is signed in');

  return sendVerificationEmailForUser(user, user.displayName || undefined);
}

export async function checkEmailVerification(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is signed in');

  try {
    // Reload user data from Firebase Auth server
    await user.reload();
    // Force token refresh to get updated claims
    await user.getIdToken(true);
  } catch (err: any) {
    // If rate-limited, check cached state instead of throwing
    if (err?.code === 'auth/too-many-requests') {
      // Return current cached state — user can try again later
      return user.emailVerified;
    }
    throw err;
  }

  if (user.emailVerified) {
    // Record verified state without unblocking blocked accounts.
    await markEmailVerified(user);
    return true;
  }

  return false;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
