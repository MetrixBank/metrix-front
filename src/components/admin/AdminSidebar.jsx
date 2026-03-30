import React, { memo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Calendar, 
  Users2, 
  Package, 
  DollarSign, 
  Map, 
  Landmark, 
  BrainCircuit, 
  GraduationCap, 
  MessageSquare, 
  LogOut,
  Target,
  FileBarChart,
  PieChart,
  Network,
  GanttChartSquare,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { roles } from '@/lib/constants';

const AdminSidebar = memo(({ user, onLogout, logoUrl, activeTab, setActiveTab, isMobile, onCloseMobile, onSwitchView }) => {
  
  // Robust check for Sub-Admin role
  const isSubAdmin = user?.role === roles.SUB_ADMIN || user?.role === 'sub-admin' || user?.distributor_type === 'sub-admin';

  // Admin / Master Admin Items
  const adminNavItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'bi', label: 'Business Intelligence', icon: PieChart },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'activities', label: 'Atividades', icon: Activity },
    { id: 'reports', label: 'Relat. Consultores', icon: FileBarChart },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'customers', label: 'Clientes', icon: Users2 },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'goals', label: 'Metas & Prêmios', icon: Target },
    { id: 'journey', label: 'Jornada', icon: Map },
    { id: 'fnx-unified', label: 'MetriX Bank', icon: Landmark },
    { id: 'intelligence', label: 'Inteligência', icon: BrainCircuit },
    { id: 'mentorship', label: 'Mentoria', icon: GraduationCap },
    { id: 'support', label: 'Suporte', icon: MessageSquare },
  ];

  // Sub-Admin (Team Leader) Items - "Membros da Equipe" (users) removed as requested
  const subAdminNavItems = [
    { id: 'overview', label: 'Painel de Equipe', icon: LayoutDashboard },
    // { id: 'users', label: 'Membros da Equipe', icon: Users }, // Removed
    { id: 'genealogy', label: 'Estrutura de Equipe', icon: Network },
    { id: 'activities', label: 'Atividades da Equipe', icon: GanttChartSquare },
    
    // Operational Items
    { id: 'purchase_intelligence', label: 'Dados Inteligentes', icon: BrainCircuit },
    { id: 'goals', label: 'Metas da Equipe', icon: Target },
    { id: 'stock', label: 'Estoque da Equipe', icon: Package },
    { id: 'customers', label: 'Clientes da Equipe', icon: Users2 },
  ];

  const navItems = isSubAdmin ? subAdminNavItems : adminNavItems;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border/30 shadow-xl transition-all duration-300",
      isMobile ? "w-full" : "w-64"
    )}>
      <div className="p-6 flex items-center justify-center border-b border-border/30 bg-card/50 backdrop-blur-sm">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
        ) : (
          <h2 className="text-2xl font-bold text-primary tracking-tight">
            {isSubAdmin ? 'METRIX EQUIPE' : 'METRIX ADMIN'}
          </h2>
        )}
      </div>

      <ScrollArea className="flex-1 py-6 px-3">
        <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Menu Principal
            </p>
            
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start mb-1 transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-primary/10 text-primary hover:bg-primary/20 border-l-4 border-primary rounded-r-md rounded-l-none shadow-sm font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md"
                )}
                onClick={() => handleTabChange(item.id)}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-transform duration-200",
                  activeTab === item.id ? "scale-110" : ""
                )} />
                {item.label}
              </Button>
            ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/30 bg-card/30 space-y-3">
         {/* Quick Switch for Sub-Admins */}
        {isSubAdmin && onSwitchView && (
           <Button 
            variant="default" 
            className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow"
            onClick={onSwitchView}
           >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Minha Área
           </Button>
        )}

        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
            {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate" title={user?.email}>{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {isSubAdmin ? 'Líder de Equipe' : (user?.role === 'master-admin' ? 'Admin Master' : 'Administrador')}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30" 
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
});

AdminSidebar.displayName = 'AdminSidebar';
export default AdminSidebar;