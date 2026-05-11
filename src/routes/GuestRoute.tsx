import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

interface GuestRouteProps {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { currentUser, needsEmailVerification, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <>{children}</>;

  return <Navigate to={needsEmailVerification ? '/verify-email' : '/'} replace />;
}
