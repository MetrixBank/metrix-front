import React, { useState, useMemo, Suspense, lazy, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChartBig, Package, Users as UsersIcon, CalendarDays, Target, Loader2, ListChecks, DollarSign, BrainCircuit } from 'lucide-react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getTabFromPath = useCallback((path, search) => {
    const params = new URLSearchParams(search);
    if (params.get('tab') === 'intelligence') return 'intelligence';

    if (path.startsWith('/agenda')) return 'agenda';
    if (path.startsWith('/sales')) return 'crm';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/stock')) return 'stock';
    if (path.startsWith('/goals')) return 'goals';
    if (path.startsWith('/financial')) return 'financial';
    return 'performance'; 
  }, []);

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname, location.search));

  useEffect(() => {
    const newTab = getTabFromPath(location.pathname, location.search);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, location.search, activeTab, getTabFromPath]);

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
  
  const TOP_MENU_TABS = useMemo(() => [
    { value: "performance", label: "Início", path: "/dashboard", icon: BarChartBig },
    { value: "crm", label: "CRM", path: "/sales", icon: ListChecks },
    { value: "agenda", label: "Agenda", path: "/agenda", icon: CalendarDays },
    { value: "customers", label: "Clientes", path: "/customers", icon: UsersIcon },
    { value: "financial", label: "Financeiro", path: "/financial", icon: DollarSign },
  ], []);

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

  const handleTabClick = useCallback((tab) => {
    if (tab.value === 'stock') {
      navigate('/stock');
    } else {
      navigate(tab.path); 
    }
    
    if (isTutorialActive) {
        const stepMap = { 
          'performance': 1, 
          'crm': 2, 
          'agenda': 3, 
          'stock': 6,
          'goals': 4, 
        };
        if (currentStep === stepMap[tab.value]) {
          setTimeout(() => nextStep(), 300);
        }
    }
  }, [navigate, isTutorialActive, currentStep, nextStep]);

  const getTutorialStepConfig = useCallback((tabValue) => {
    const steps = {
      'performance': { step: 1, content: "Primeiro, vamos para 'Desempenho' para analisar seus resultados com gráficos e indicadores." },
      'crm': { step: 2, content: "No 'CRM', você registra e acompanha suas negociações e funil de vendas." }, 
      'agenda': { step: 3, content: "Organize seus compromissos e atividades na 'Agenda'." },
      'stock': { step: 6, content: "Em 'Estoque', gerencie seus produtos e quantidades." }, 
      'goals': { step: 4, content: "Acompanhe suas 'Metas' e celebre suas conquistas." },
    };
    return steps[tabValue] || { step: -1, content: '' };
  }, []);

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
        className={`min-h-screen flex flex-col cockpit-bg text-foreground`}
      >
        <DashboardHeader /> 

        <div className={`flex-1 p-3 sm:p-4 lg:p-8 ${isMobile ? 'pb-24' : 'pb-4'}`}>
          <div className="max-w-7xl mx-auto w-full">
            <div className="w-full mt-6">
              {!isMobile && (
                <div className="grid grid-cols-5 gap-2 w-full p-0 mb-6 relative">
                  {TOP_MENU_TABS.map((tab) => {
                    const tutorialConfig = getTutorialStepConfig(tab.value);
                    const isActive = activeTab === tab.value;
                    return (
                    <TutorialStep
                      key={tab.value}
                      step={tutorialConfig.step}
                      content={tutorialConfig.content}
                      isActive={isTutorialActive && currentStep === tutorialConfig.step}
                    >
                      <button
                        onClick={() => handleTabClick(tab)}
                        className={`w-full px-4 py-3 text-sm rounded-md border border-transparent hover:bg-muted/50 flex items-center justify-center transition-all duration-200 group relative z-10 ${isActive ? 'text-primary font-semibold bg-primary/5 shadow-sm' : 'text-muted-foreground'}`}
                      >
                        <tab.icon className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" /> {tab.label}
                      </button>
                    </TutorialStep>
                    )
                  })}
                </div>
              )}

              <div className={isMobile ? "mt-0" : "mt-4"}>
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