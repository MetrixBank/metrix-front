import React, { useState, Suspense } from 'react';
import { 
  Bot, Calendar, Users, Briefcase, Landmark, GraduationCap, LifeBuoy, Package, LayoutDashboard, Database, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExecutiveHeader from './ExecutiveHeader';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Lazy Load Components for Performance
const AdminMasterDashboard = React.lazy(() => import('../dashboard/AdminMasterDashboard'));
const CopilotoDeVendasTab = React.lazy(() => import('../tabs/CopilotoDeVendasTab'));
const AdminActivitiesTab = React.lazy(() => import('../activities/AdminActivitiesTab'));
const AdminUsersTab = React.lazy(() => import('../users/AdminUsersTab'));
const AdminCalendarTab = React.lazy(() => import('../calendar/AdminCalendarTab'));
const AdminCustomersTab = React.lazy(() => import('../customers/AdminCustomersTab'));
const AdminStockTab = React.lazy(() => import('../stock/AdminStockTab'));
const FinanceiroTab = React.lazy(() => import('../tabs/FinanceiroTab'));
const MetrixBankTab = React.lazy(() => import('../tabs/MetrixBankTab'));
const AdminMentorshipTab = React.lazy(() => import('../mentorship/AdminMentorshipTab'));
const AdminSupportTab = React.lazy(() => import('../support/AdminSupportTab'));

const AdminMasterLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [period, setPeriod] = useState('month');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: AdminMasterDashboard },
    { id: 'copilot', label: 'Copiloto', icon: Bot, component: CopilotoDeVendasTab },
    { id: 'activities', label: 'Atividades', icon: Calendar, component: AdminActivitiesTab },
    { id: 'users', label: 'Usuários', icon: Users, component: AdminUsersTab },
    { id: 'calendar', label: 'Agenda', icon: Calendar, component: AdminCalendarTab },
    { id: 'customers', label: 'Clientes', icon: Database, component: AdminCustomersTab },
    { id: 'stock', label: 'Estoque', icon: Package, component: AdminStockTab },
    { id: 'financial', label: 'Financeiro', icon: Briefcase, component: FinanceiroTab },
    { id: 'bank', label: 'MétriX Bank', icon: Landmark, component: MetrixBankTab },
    { id: 'mentorship', label: 'Mentoria', icon: GraduationCap, component: AdminMentorshipTab },
    { id: 'support', label: 'Suporte', icon: LifeBuoy, component: AdminSupportTab },
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || AdminMasterDashboard;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">
      <ExecutiveHeader period={period} setPeriod={setPeriod} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <aside 
            className={cn(
                "bg-[#0f172a]/95 backdrop-blur border-r border-white/5 flex-col fixed md:relative z-30 h-full transition-all duration-300 w-64 shadow-2xl",
                !isSidebarOpen && "md:w-0 md:border-none -translate-x-full md:translate-x-0"
            )}
        >
          <div className="p-3 space-y-1 overflow-y-auto h-full pb-20 custom-scrollbar">
            <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Navegação</p>
            {menuItems.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={cn(
                    "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all border mb-1",
                    activeTab === item.id 
                        ? "bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-300 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] border-l-4 border-l-emerald-500" 
                        : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeTab === item.id && "text-emerald-400")} />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && <motion.div layoutId="activeTabIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
              </Button>
            ))}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative scroll-smooth custom-scrollbar bg-slate-950/50">
           {/* Background Ambient Glow */}
           <div className="fixed top-0 left-0 w-full h-96 bg-emerald-900/5 blur-[120px] -z-10 pointer-events-none" />
           <div className="fixed bottom-0 right-0 w-full h-96 bg-blue-900/5 blur-[120px] -z-10 pointer-events-none" />
           
           <div className="max-w-[1800px] mx-auto space-y-6 pb-10">
              <Suspense fallback={
                  <div className="flex h-[50vh] w-full items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <p className="text-slate-500 text-sm">Carregando módulo...</p>
                      </div>
                  </div>
              }>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ActiveComponent />
                    </motion.div>
                </AnimatePresence>
              </Suspense>
           </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMasterLayout;