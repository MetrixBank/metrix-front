import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LoadingFallback } from '@/components/LoadingFallback';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, session, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session && user) {
        signOut();
    }
  }, [loading, session, user, signOut]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'master-admin') {
        return <Navigate to="/admin-master" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;