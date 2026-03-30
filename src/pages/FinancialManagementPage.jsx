import React from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import FinancialDashboard from '@/pages/fnx-solutions/FinancialDashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const FinancialManagementPage = () => {
  const { user } = useAuth();
  
  // Render structure immediately. Data loading happens inside FinancialDashboard.
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
       {/* DashboardHeader is now outside of the sticky wrapper to avoid double headers */}
       <DashboardHeader />
       
       <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto space-y-6">
             <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Metrix Bank</h1>
             <p className="text-muted-foreground mb-6">Gerencie suas finanças, propostas e recebíveis.</p>
             <FinancialDashboard />
          </div>
       </main>
    </div>
  );
};

export default FinancialManagementPage;