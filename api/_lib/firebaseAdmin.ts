/**
 * Firebase Admin SDK initialization — backend only.
 * Uses FIREBASE_SERVICE_ACCOUNT environment variable.
 * This file must NEVER be imported from client/frontend code.
 *
 * Uses firebase-admin v13+ modular imports.
 */
import { initializeApp, cert, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let initialized = false;

export function getAdminApp(): App {
  if (initialized) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    // TODO: Set the FIREBASE_SERVICE_ACCOUNT environment variable.
    // It should contain the full JSON string of your Firebase service account key.
    // You can download it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
    // Then paste the entire JSON as the value of FIREBASE_SERVICE_ACCOUNT in your .env / Vercel env vars.
    throw new Error(
      '[Firebase Admin] FIREBASE_SERVICE_ACCOUNT environment variable is missing. ' +
      'Please set it to your Firebase service account JSON string.'
    );
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (err) {
    throw new Error(
      '[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT. ' +
      'Ensure it is a valid JSON string. Error: ' + (err as Error).message
    );
  }

  initializeApp({
    credential: cert(serviceAccount as any),
  });

  initialized = true;
  return getApp();
}

/**
 * Get the Firebase Auth admin instance.
 */
export function getAdminAuth(): Auth {
  getAdminApp();
  return getAuth();
}
