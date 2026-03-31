import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthProvider';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">
      Loading...
    </div>
  );
}

export function ProtectedOutlet() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyOutlet() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
