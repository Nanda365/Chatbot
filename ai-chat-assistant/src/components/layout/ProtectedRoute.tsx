import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-glow">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Only enforce authentication for admin-only routes
  if (adminOnly) {
    if (!user) {
      // If no user, redirect to login
      return <Navigate to="/auth/login" replace />;
    }
    if (!isAdmin) {
      // If user is not an admin, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // For non-adminOnly protected routes (History, Settings),
  // authentication is optional. We allow access and the
  // component itself can decide what to show.
  return <>{children}</>;
}
