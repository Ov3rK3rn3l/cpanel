
    import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AdminDashboardPage from '@/pages/admin/DashboardPage';
import MemberDashboardPage from '@/pages/member/DashboardPage';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import SteamScannerPage from '@/pages/SteamScannerPage';
import QuizPage from '@/pages/member/QuizPage';
import MainLayout from '@/components/layouts/MainLayout';
import { Loader2 } from 'lucide-react';
import QuizManagementPage from '@/pages/admin/QuizManagementPage';
import StoreManagementPage from '@/pages/admin/StoreManagementPage';
import StorePage from '@/pages/member/StorePage';
import RecruitmentPage from '@/pages/RecruitmentPage';
import RecruitmentManagementPage from '@/pages/admin/RecruitmentManagementPage';
import RecruiterStatisticsPage from '@/pages/admin/RecruiterStatisticsPage';
import BackupPage from '@/pages/admin/BackupPage';
import InventoryPage from '@/pages/member/InventoryPage';
import LogsPage from '@/pages/admin/LogsPage';
import SchedulePage from '@/pages/admin/SchedulePage';

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

const AppRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recrutamento" element={<RecruitmentPage />} />
        
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
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />
         <Route 
          path="/steam-scanner"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
              <SteamScannerPage />
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
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['member', 'admin', 'moderador', 'recrutador']}>
              <InventoryPage />
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
         <Route 
          path="/admin/recruitment"
          element={
            <ProtectedRoute allowedRoles={['admin', 'recrutador']}>
              <RecruitmentManagementPage />
            </ProtectedRoute>
          }
        />
         <Route 
          path="/admin/recruiter-stats"
          element={
            <ProtectedRoute allowedRoles={['admin', 'recrutador']}>
              <RecruiterStatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/backup"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BackupPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'moderador', 'recrutador']}>
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/agenda"
          element={
            <ProtectedRoute allowedRoles={['admin', 'moderador', 'recrutador']}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
  