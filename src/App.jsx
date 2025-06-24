import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import MemberDashboardPage from '@/pages/member/DashboardPage';
import QuizPage from '@/pages/member/QuizPage';
import MainLayout from '@/components/layouts/MainLayout';
import { Loader2 } from 'lucide-react';
import QuizManagementPage from '@/pages/admin/QuizManagementPage';
import StoreManagementPage from '@/pages/admin/StoreManagementPage';
import StorePage from '@/pages/member/StorePage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex flex-col items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-xl text-muted-foreground">Carregando sua sessão...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'member') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />; 
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'moderador', 'recrutador']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
                  <MemberDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz"
              element={
                <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
             <Route 
              path="/store"
              element={
                <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
                  <StorePage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/quiz-management"
              element={
                <ProtectedRoute allowedRoles={['admin', 'moderador']}>
                  <QuizManagementPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/store-management"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StoreManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;