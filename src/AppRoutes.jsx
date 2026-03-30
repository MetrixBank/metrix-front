import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import GoalsPage from '@/components/management/goals/GoalsPage';
import ErrorBoundary from '@/components/ErrorBoundary';

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/goals" element={<GoalsPage />} />
           {/* Add other existing routes here as needed based on original codebase, 
               but for this task we ensure /goals is present */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;