import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserProfileForm } from '../types/user';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  uid: string,
  data: UserProfileForm
): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { ...data });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
  return users.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export async function updateUserStatus(
  uid: string,
  status: 'active' | 'blocked'
): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { status });
}

export async function updateUserRole(
  uid: string,
  role: 'customer' | 'admin'
): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { role });
}
