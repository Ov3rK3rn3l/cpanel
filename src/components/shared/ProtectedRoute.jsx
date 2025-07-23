import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex flex-col items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-xl text-muted-foreground">Carregando sua sessão...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (['admin', 'moderador', 'recrutador'].includes(userRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;