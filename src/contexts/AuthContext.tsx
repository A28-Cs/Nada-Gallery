import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/userService';
import { signInWithGoogle as signInWithGoogleService } from '../services/authService';
import { UserProfile } from '../types/user';
import { ADMIN_EMAIL } from '../config/constants';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  authProvider: string | null;
  /**
   * True when an email/password user has NOT verified their email yet.
   * Google users are always considered verified.
   */
  needsEmailVerification: boolean;
  signInWithGoogle: () => Promise<User>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  emailVerified: false,
  authProvider: null,
  needsEmailVerification: false,
  signInWithGoogle: async () => { throw new Error('Not initialized'); },
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin requires role === 'admin' in Firestore or matching ADMIN_EMAIL
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === ADMIN_EMAIL;

  const emailVerified = currentUser?.emailVerified ?? false;

  // Detect auth provider from Firebase Auth providerData
  const authProvider =
    currentUser?.providerData?.[0]?.providerId ?? null;

  // Email/password user who hasn't verified yet
  const needsEmailVerification =
    !!currentUser &&
    authProvider === 'password' &&
    !currentUser.emailVerified;

  const refreshProfile = async () => {
    if (currentUser) {
      // Also reload user from Firebase Auth to get latest emailVerified
      await currentUser.reload();
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      // Force re-render with updated user data
      setCurrentUser({ ...auth.currentUser } as User);
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    const user = await signInWithGoogleService();
    // Refresh profile immediately after Google sign-in
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
    setCurrentUser(user);
    return user;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    emailVerified,
    authProvider,
    needsEmailVerification,
    signInWithGoogle,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
