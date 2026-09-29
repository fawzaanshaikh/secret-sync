import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready, isAdmin } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(null);

  useEffect(() => {
    if (!user) api.needsSetup().then((r) => setNeedsSetup(r.needsSetup));
  }, [user]);

  if (!ready) return null;
  if (!user) {
    if (needsSetup === null) return null;
    return <Navigate to={needsSetup ? '/setup' : '/login'} replace />;
  }
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
