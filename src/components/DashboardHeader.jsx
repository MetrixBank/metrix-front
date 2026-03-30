import React, { useState, memo } from 'react';
import { Menu, X, Home, Calendar, Users, DollarSign, Settings, GraduationCap, LifeBuoy, BarChart2, Package, Target, Network, Landmark, Briefcase, Bot, Sliders } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationBell from '@/components/NotificationBell';
import useMediaQuery from '@/hooks/useMediaQuery';

const roles = {
  ADMIN: 'admin',
  MASTER_ADMIN: 'master-admin',
  DISTRIBUTOR: 'distributor',
  SUB_ADMIN: 'sub-admin'
};

const navItems = [
  { path: "/dashboard?tab=intelligence", icon: Bot, label: "Copiloto de Vendas", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/goals", icon: Target, label: "Metas", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/fnx-solutions", icon: Landmark, label: "MetriX Bank", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/stock", icon: Package, label: "Estoque", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/team", icon: Network, label: "Painel de Equipe", roles: [roles.SUB_ADMIN] },
  { path: "/mentorship", icon: GraduationCap, label: "Mentoria", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/support", icon: LifeBuoy, label: "Suporte", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] }
];

const adminNavItems = [
  { path: "/admin/dashboard", icon: Home, label: "Início", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/users", icon: Users, label: "Usuários", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/activities", icon: Calendar, label: "Atividades", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/customers", icon: Users, label: "Clientes", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/stock", icon: Briefcase, label: "Estoque", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/financial", icon: DollarSign, label: "Financeiro", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/proposals", icon: BarChart2, label: "Propostas FNX", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/goals", icon: Briefcase, label: "Metas", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/journey", icon: GraduationCap, label: "Jornada", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/mentorship", icon: GraduationCap, label: "Mentoria", roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/admin/support", icon: LifeBuoy, label: "Suporte", roles: [roles.ADMIN, roles.MASTER_ADMIN] }
];

const mobileBottomBarItems = ["/dashboard", "/sales", "/agenda", "/customers", "/financial"];

const DashboardHeader = memo(() => {
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)"); 
  const location = useLocation();
  const userRole = user?.role;
  const isAdmin = userRole === roles.ADMIN || userRole === roles.MASTER_ADMIN;
  const homeLink = isAdmin ? "/admin/dashboard" : "/dashboard";
  
  const getFilteredNavItems = () => {
    if (!userRole) return [];
    let items = [];
    if (userRole === roles.ADMIN || userRole === roles.MASTER_ADMIN) items = adminNavItems.filter(item => item.roles.includes(userRole));
    else {
      items = navItems.filter(item => item.roles.includes(userRole));
      if (!isDesktop) items = items.filter(item => !mobileBottomBarItems.includes(item.path));
    }
    return items;
  };
  
  const filteredNavItems = getFilteredNavItems();
  const isItemActive = (itemPath) => itemPath.includes('?') ? (location.pathname + location.search) === itemPath : location.pathname === itemPath;

  return (
    <header className="relative w-full bg-background border-b border-border/30 py-3 px-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-4">
        {filteredNavItems.length > 0 && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-primary"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:max-w-xs flex flex-col p-0 z-[60] bg-background border-r">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center justify-center">
                  <img className="h-20 w-auto" alt="MetriX logo" src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/bb2c8f92-305c-4fa2-b51c-2c1afed92f11-7KcFL.png" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex flex-col gap-1 px-2">
                    {filteredNavItems.map(item => (
                        <NavLink 
                            key={item.path} 
                            to={item.path} 
                            className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-accent relative group", isItemActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground")} 
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
              </div>
              <div className="p-4 border-t mt-auto"><Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => { setIsSidebarOpen(false); signOut(); }}><X className="mr-3 h-5 w-5" />Sair</Button></div>
            </SheetContent>
          </Sheet>
        )}
        <NavLink to={homeLink} className="flex items-center gap-2">
            <img className="h-10 w-auto hidden sm:block" alt="MetriX logo" src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/1ae7e25f-1100-4f17-9abc-8a1d3ec0fab3-fquwp.png-gq7TG.webp" />
            <img className="h-10 w-auto sm:hidden" alt="MetriX icon" src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/1ae7e25f-1100-4f17-9abc-8a1d3ec0fab3-fqUWp.png" />
        </NavLink>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-9 w-9 rounded-full"><Avatar className="h-9 w-9"><AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} /><AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 z-[60]" align="end" forceMount>
            <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user?.name}</p><p className="text-xs leading-none text-muted-foreground">{user?.email}</p></div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><NavLink to="/profile" className="flex items-center w-full cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>Minha Conta</span></NavLink></DropdownMenuItem>
            {(userRole === roles.DISTRIBUTOR || userRole === roles.SUB_ADMIN) && (<DropdownMenuItem asChild><NavLink to="/settings" className="flex items-center w-full cursor-pointer"><Sliders className="mr-2 h-4 w-4" /><span>Integrações</span></NavLink></DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer"><X className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
export default DashboardHeader;