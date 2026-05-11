import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  status: 'active' | 'blocked' | 'pending_verification';
  photoURL?: string;
  authProvider?: 'password' | 'google';
  emailVerified?: boolean;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfileForm {
  name: string;
  phone: string;
  address: string;
}
