import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LoadingFallback, LOGO_URL } from '@/components/LoadingFallback';

// Lazy loading components
const LandingPage = lazy(() => import('@/pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('@/components/login/LoginPage.jsx'));
const AdminMasterLayout = lazy(() => import('@/components/admin/layout/AdminMasterLayout.jsx'));
const UserProfilePage = lazy(() => import('@/components/UserProfilePage.jsx'));
const CompanyManagementPage = lazy(() => import('@/components/CompanyManagementPage.jsx'));
const TeamDashboard = lazy(() => import('@/components/sub-admin/TeamDashboard.jsx')); 
const ResetPasswordPage = lazy(() => import('@/components/ResetPasswordPage.jsx'));
const AuthCallbackPage = lazy(() => import('@/components/AuthCallbackPage.jsx'));
const FnxSolutionsPage = lazy(() => import('@/pages/fnx-solutions/FnxSolutionsPage.jsx'));
const MentorshipPage = lazy(() => import('@/pages/mentorship/MentorshipPage.jsx'));
const SupportPage = lazy(() => import('@/pages/support/SupportPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage.jsx'));
const DistributorSettingsPage = lazy(() => import('@/components/admin/webhooks/DistributorSettingsPage.jsx'));
const WebhookTestPage = lazy(() => import('@/pages/WebhookTestPage.jsx'));
const GoalsPage = lazy(() => import('@/components/management/goals/GoalsPage.jsx'));
const ReportsPage = lazy(() => import('@/components/admin/reports/ReportsPage.jsx'));
const FunnelIntelligencePage = lazy(() => import('@/pages/FunnelIntelligencePage.jsx'));

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 gradient-bg">
    <img src={LOGO_URL} alt="MetriX Logo" className="h-24 w-auto mb-8 animate-float sm:h-28" />
    <h1 className="text-4xl font-bold text-destructive mb-4">404 - Página Não Encontrada</h1>
    <p className="text-lg text-muted-foreground mb-8">Oops! A página que você está procurando não existe.</p>
    <Link to="/" className="text-primary hover:underline">Voltar para a Página Inicial</Link>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const getRedirectPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin' || user.role === 'master-admin') return '/admin-master';
    return '/dashboard';
  };

  if (loading) return <LoadingFallback />;

  return (
    <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getRedirectPath()} replace />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/webhook-test" element={<WebhookTestPage />} />
          
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><DistributorSettingsPage /></ProtectedRoute>} />
          <Route path="/admin-master/*" element={<ProtectedRoute allowedRoles={['admin', 'master-admin']}><AdminMasterLayout /></ProtectedRoute>} />
          <Route path="/admin/*" element={ <Navigate to="/admin-master" replace /> } />
          
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/company-management" element={<Navigate to="/dashboard" replace />} />
          
          {/* New Standardized Routes */}
          <Route path="/funnel-intelligence" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><FunnelIntelligencePage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><GoalsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin', 'admin', 'master-admin']}><ReportsPage /></ProtectedRoute>} />

          {/* Legacy routes pointing to dashboard */}
          <Route path="/agenda" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/management" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          
          <Route path="/team" element={<ProtectedRoute allowedRoles={['sub-admin']}><TeamDashboard user={user} logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/financial" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin', 'admin', 'master-admin']}><CompanyManagementPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/fnx-solutions" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><FnxSolutionsPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/mentorship" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><MentorshipPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute allowedRoles={['distributor', 'sub-admin']}><SupportPage logoUrl={LOGO_URL} /></ProtectedRoute>} />
          
          <Route path="/" element={user ? <Navigate to={getRedirectPath()} replace /> : <LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </Suspense>
  );
};

export default AppRoutes;