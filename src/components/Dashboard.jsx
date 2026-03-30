import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Calendar, BarChart, ShoppingCart, Target, TrendingUp, Zap, HelpCircle, LogOut, MessageSquare, Briefcase, Bot, BrainCircuit, Network, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import useMediaQuery from '@/hooks/useMediaQuery';
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AiAssistant from '@/components/assistant/AiAssistant.jsx';
import AddSalesActivityModal from '@/components/AddSalesActivityModal.jsx';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { AiAssistantContext } from '@/contexts/AiAssistantContext';
import { roles } from '@/lib/constants';

// Fixed lazy imports with explicit .jsx extensions
const DashboardHeader = lazy(() => import('@/components/DashboardHeader.jsx'));
const BottomNavigationBar = lazy(() => import('@/components/BottomNavigationBar.jsx'));
const OverviewTab = lazy(() => import('@/components/management/OverviewTab.jsx'));
const AgendaTab = lazy(() => import('@/components/management/AgendaTab.jsx'));
const ActivitiesTab = lazy(() => import('@/components/management/ActivitiesTab.jsx'));
const CustomersTab = lazy(() => import('@/components/management/CustomersTab.jsx'));
const StockManagementTab = lazy(() => import('@/components/management/StockManagementTab.jsx'));
const GoalsTab = lazy(() => import('@/components/management/GoalsTab.jsx'));
const PerformanceDashboardTab = lazy(() => import('@/components/management/PerformanceDashboardTab.jsx'));
const SalesFunnelTab = lazy(() => import('@/components/management/SalesFunnelTab.jsx'));
const DataIntelligenceSection = lazy(() => import('@/components/management/DataIntelligenceSection.jsx'));

const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/f96cbb85c74adc6f3504140b2cff4706.png";

const tabs = [
  { id: 'overview', label: 'Início', icon: TrendingUp },
  { id: 'intelligence', label: 'Copiloto de Vendas', icon: BrainCircuit },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'activities', label: 'Atividades', icon: Zap },
  { id: 'customers', label: 'Clientes', icon: User },
  { id: 'stock', label: 'Estoque', icon: ShoppingCart },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'matrix-bank', label: 'MetriX Bank', icon: Banknote },
  { id: 'performance', label: 'Desempenho', icon: BarChart },
  { id: 'funnel', label: 'Funil de Vendas', icon: Briefcase },
];

const LoadingComponent = () => (
  <div className="flex-grow flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full animate-spin border-4 border-dashed border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [isAddActivityModalOpen, setAddActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const { pendingTasksCount } = React.useContext(AiAssistantContext);
  const { triggerSync } = useDataSync();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Updated logic to determine active tab based on URL path and query params
  useEffect(() => {
    const path = location.pathname;
    const tabParam = searchParams.get('tab');

    // Special handling for external stock navigation
    if (path === '/stock' && !tabParam) { // Only if path is /stock and no other tab param is active
      // Do not set activeTab for stock here if it's external, let it fall through or default
      // We will handle navigation in handleTabClick directly.
    } else if (path === '/agenda') {
      setActiveTab('agenda');
    } else if (path === '/customers') {
      setActiveTab('customers');
    } else if (path === '/goals') {
      setActiveTab('goals');
    } else if (path === '/sales' || path === '/activities') { 
      setActiveTab('activities');
    } else if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname, searchParams]);

  const handleOpenActivityModal = (activityData = null) => {
    setEditingActivity(activityData);
    setAddActivityModalOpen(true);
  };
  
  const handleCloseActivityModal = () => {
    setAddActivityModalOpen(false);
    setEditingActivity(null);
  };
  
  const handleActivityAdded = () => {
    triggerSync();
    handleCloseActivityModal();
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Task 1: Updated navigation handler for "Estoque" button
  const handleTabClick = (tabId) => {
    if (tabId === 'stock') {
      window.open('https://tokengsp.site/stock', '_blank'); // Open external URL in new tab
      // Optionally, you might want to keep the current internal tab active or navigate to overview
      // For now, no internal navigation for stock.
    } else if (tabId === 'customers') {
      navigate('/customers');
    } else if (tabId === 'agenda') {
      navigate('/agenda');
    } else if (tabId === 'activities') {
      navigate('/sales');
    } else if (tabId === 'goals') {
      navigate('/goals');
    } else if (tabId === 'matrix-bank') {
      navigate('/fnx-solutions');
    } else {
      navigate(`/dashboard?tab=${tabId}`);
    }
    setActiveTab(tabId); // Still set activeTab for internal display logic if needed
  };

  const handleNavigateToCustomer = (isNew) => {
    navigate('/customers');
  };

  const handleNavigateToAgenda = () => {
    navigate('/agenda');
  };

  const handleNavigateToFnxBank = () => {
    navigate('/fnx-solutions');
  };

  // Check for Sub-Admin Role (Role 'sub-admin' OR Distributor Type 'sub-admin')
  const isSubAdmin = user?.role === roles.SUB_ADMIN || user?.role === 'sub-admin' || user?.distributor_type === 'sub-admin';

  if (authLoading) {
    return <LoadingComponent />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab user={user} onNavigate={handleTabClick} onOpenActivityModal={handleOpenActivityModal} />;
      case 'intelligence': return <div className="space-y-4"><DataIntelligenceSection user={user} /></div>;
      case 'agenda': return <AgendaTab user={user} onOpenActivityModal={handleOpenActivityModal} />;
      case 'activities': return <ActivitiesTab user={user} onOpenActivityModal={handleOpenActivityModal} />;
      case 'customers': return <CustomersTab user={user} />;
      case 'stock': return <StockManagementTab user={user} />; // This tab might still render content if active, even if the button goes external
      case 'goals': return <GoalsTab user={user} />;
      case 'performance': return <PerformanceDashboardTab user={user} />;
      case 'funnel': return <SalesFunnelTab user={user} />;
      case 'matrix-bank': return (
        <div className="flex flex-col items-center justify-center h-full text-white/50">
          <Banknote className="w-16 h-16 mb-4" />
          <p className="text-xl font-semibold mb-2">Bem-vindo ao MetriX Bank!</p>
          <p className="text-sm text-center max-w-md">Gerencie suas finanças, propostas e recebíveis. Navegue para a seção MetriX Bank para detalhes.</p>
          <Button onClick={handleNavigateToFnxBank} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white">Ir para MetriX Bank</Button>
        </div>
      );
      default: return <OverviewTab user={user} onNavigate={handleTabClick} onOpenActivityModal={handleOpenActivityModal} />;
    }
  };

  const orderedTabs = [
    tabs.find(t => t.id === 'overview'),
    tabs.find(t => t.id === 'intelligence'),
    tabs.find(t => t.id === 'agenda'),
    tabs.find(t => t.id === 'activities'),
    tabs.find(t => t.id === 'customers'),
    tabs.find(t => t.id === 'stock'), // Ensure this is the correct tab for navigation
    tabs.find(t => t.id === 'goals'),
    tabs.find(t => t.id === 'matrix-bank'), // MetriX Bank after Metas
    tabs.find(t => t.id === 'performance'),
    tabs.find(t => t.id === 'funnel'),
  ].filter(Boolean); // Filter out any undefined if tab IDs are not found

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        
       {/* Header is static now */}
       <Suspense fallback={null}>
         <DashboardHeader
            user={user}
            onNotificationClick={() => setAssistantOpen(true)}
            notificationCount={pendingTasksCount}
            logoUrl={LOGO_URL}
          />
       </Suspense>

       <div className="flex flex-1 relative">
           {/* Sidebar - fixed within the flex container logic on desktop */}
           {isDesktop && (
            <aside className="w-64 border-r border-border/30 flex flex-col p-4 space-y-2 overflow-y-auto custom-scrollbar h-[calc(100vh-64px)] sticky top-0">
              
              {isSubAdmin && (
                <button
                  onClick={() => navigate('/team')}
                  className="w-full flex items-center p-3 mb-4 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <Network className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Painel de Equipe
                </button>
              )}

              <div className="space-y-1 flex-1">
                {orderedTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out relative ${
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    <div className="relative flex items-center">
                      <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                      {tab.label}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-border/30 space-y-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => navigate('/support')}
                    className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
                  >
                    <HelpCircle className="w-5 h-5 mr-3" />
                    Ajuda e Suporte
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                  </button>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <Suspense fallback={<LoadingComponent />}>
                  {renderTabContent()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <Toaster />
        
        {!isDesktop && (
          <BottomNavigationBar
            tabs={orderedTabs}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onLogout={signOut}
            onAddClick={() => handleOpenActivityModal()}
          />
        )}

       <AiAssistant
          isOpen={isAssistantOpen}
          onClose={() => setAssistantOpen(false)}
          user={user}
          logoUrl={LOGO_URL}
          onNavigateToCustomer={handleNavigateToCustomer}
          onNavigateToAgenda={handleNavigateToAgenda}
          onOpenActivityModal={handleOpenActivityModal}
          onTasksUpdated={triggerSync}
        />
        
        {isAddActivityModalOpen && (
          <AddSalesActivityModal
            isOpen={isAddActivityModalOpen}
            onClose={handleCloseActivityModal}
            user={user}
            onActivityAdded={handleActivityAdded}
            activityData={editingActivity}
          />
        )}
    </div>
  );
};

export default Dashboard;