import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, needsEmailVerification, userProfile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;

  // Email/password users who haven't verified → send to verify page
  if (needsEmailVerification) return <Navigate to="/verify-email" replace />;

  // Blocked users → send to home with a message
  if (userProfile?.status === 'blocked') return <Navigate to="/" replace />;

  return <>{children}</>;
}
