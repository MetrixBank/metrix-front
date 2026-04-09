import React, { useState, useMemo, Suspense, lazy, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChartBig, Package, Users as UsersIcon, CalendarDays, Target, Loader2, ListChecks, DollarSign, BrainCircuit } from 'lucide-react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useTeamView } from '@/contexts/TeamViewContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { AiAssistantContext } from '@/contexts/AiAssistantContext';

import DashboardHeader from '@/components/DashboardHeader';
import BottomNavigationBar from '@/components/BottomNavigationBar';
import { Button } from '@/components/ui/button';
import TutorialStep from '@/components/tutorial/TutorialStep';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getCompanyShellTabFromLocation } from '@/lib/mainTopNav';

// Lazy load all tab components
const TeamDashboard = lazy(() => import('@/components/sub-admin/TeamDashboard'));
const PerformanceDashboardTab = lazy(() => import('@/components/management/PerformanceDashboardTab'));
const ActivitiesTab = lazy(() => import('@/components/management/ActivitiesTab'));
const AgendaTab = lazy(() => import('@/components/management/AgendaTab'));
const GoalsTab = lazy(() => import('@/components/management/GoalsTab'));
const CustomersTab = lazy(() => import('@/components/management/CustomersTab')); 
const StockManagementTab = lazy(() => import('@/components/management/StockManagementTab'));
const AddSalesActivityModal = lazy(() => import('@/components/AddSalesActivityModal'));
const DataIntelligenceSection = lazy(() => import('@/components/management/DataIntelligenceSection'));
const FinancialDashboard = lazy(() => import('@/pages/fnx-solutions/FinancialDashboard'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const CompanyManagementPage = ({ logoUrl }) => {
  const { user } = useAuth();
  const { isTutorialActive, currentStep, nextStep } = useTutorial();
  const { isTeamView } = useTeamView();
  const { triggerSync } = useDataSync();
  const { pendingTasksCount, setAssistantOpen, setActivityToEdit } = React.useContext(AiAssistantContext);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() =>
    getCompanyShellTabFromLocation(location.pathname, location.search),
  );

  useEffect(() => {
    const newTab = getCompanyShellTabFromLocation(location.pathname, location.search);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, location.search, activeTab]);

  const TABS_CONFIG = useMemo(() => [
    { value: "performance", label: "Início", path: "/dashboard", icon: BarChartBig, component: PerformanceDashboardTab, props: { user } },
    { value: "intelligence", label: "Dados Inteligentes", path: "/dashboard?tab=intelligence", icon: BrainCircuit, component: DataIntelligenceSection, props: { user } },
    { value: "crm", label: "CRM", path: "/sales", icon: ListChecks, component: ActivitiesTab, props: { user } },
    { value: "agenda", label: "Agenda", path: "/agenda", icon: CalendarDays, component: AgendaTab, props: { user } },
    { value: "customers", label: "Clientes", path: "/customers", icon: UsersIcon, component: CustomersTab, props: { user } },
    { value: "financial", label: "Financeiro", path: "/financial", icon: DollarSign, component: FinancialDashboard, props: { user } },
    { value: "stock", label: "Estoque", path: "/stock", icon: Package, component: StockManagementTab, props: { user } },
    { value: "goals", label: "Metas", path: "/goals", icon: Target, component: GoalsTab, props: { user } },
  ], [user]);

  useEffect(() => {
    if (isTutorialActive && currentStep === 6) {
      const timer = setTimeout(() => {
        nextStep();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isTutorialActive, currentStep, nextStep]);

  const handleCloseActivityModal = useCallback(() => {
    setIsActivityModalOpen(false);
    setActivityToEdit(null);
  }, [setActivityToEdit]);

  const assistantIconUrl = "https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/2da79d9a13d587bb8b908cfd2f0c3273.png";

  const ActiveComponent = TABS_CONFIG.find(t => t.value === activeTab)?.component || PerformanceDashboardTab;
  const activeProps = TABS_CONFIG.find(t => t.value === activeTab)?.props || { user };

  if (isTeamView && user?.role === 'sub-admin') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <TeamDashboard user={user} logoUrl={logoUrl} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex flex-col bg-[color:var(--nocturnal-bg)] text-foreground"
      >
        <DashboardHeader /> 

        <div className={`flex-1 p-3 sm:p-4 lg:p-8 ${isMobile ? 'pb-24' : 'pb-4'}`}>
          <div className="max-w-7xl mx-auto w-full">
            <div className="w-full mt-2 sm:mt-4">
              <div className={isMobile ? "mt-0" : "mt-2"}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ErrorBoundary>
                      <Suspense fallback={<LoadingFallback />}>
                        <ActiveComponent {...activeProps} />
                      </Suspense>
                    </ErrorBoundary>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        {isMobile && <BottomNavigationBar />}

        <motion.div
          className={`fixed ${isMobile ? 'bottom-24' : 'bottom-6'} right-6 z-50`}
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
        >
          <TutorialStep step={7} content="Clique aqui para acessar o Assistente de IA.">
              <Button
                  onClick={() => setAssistantOpen(true)}
                  className="relative rounded-full h-14 w-14 bg-background/80 shadow-lg shadow-primary/50 hover:scale-110 transition-transform flex items-center justify-center overflow-hidden p-0 backdrop-blur-sm border border-white/20"
              >
                  <img src={assistantIconUrl} alt="Assistente IA" className="w-10 h-10 object-contain" />
                  {pendingTasksCount > 0 && (
                      <motion.span
                          className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center text-xs font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        {pendingTasksCount}
                      </motion.span>
                  )}
              </Button>
          </TutorialStep>
        </motion.div>
        
        <Suspense fallback={null}>
          {isActivityModalOpen && (
            <AddSalesActivityModal
              isOpen={isActivityModalOpen}
              onClose={handleCloseActivityModal}
              user={user}
              onActivityAdded={() => {
                triggerSync();
                handleCloseActivityModal();
              }}
              activityData={null}
            />
          )}
        </Suspense>
      </motion.div>
    </ErrorBoundary>
  );
};

export default CompanyManagementPage;
