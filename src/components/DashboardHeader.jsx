import React, { useState, memo, useCallback } from 'react';
import {
  Menu,
  X,
  Home,
  Calendar,
  Users,
  DollarSign,
  Settings,
  GraduationCap,
  LifeBuoy,
  BarChart2,
  Package,
  Target,
  Network,
  Landmark,
  Briefcase,
  Bot,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from '@/components/NotificationBell';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useTutorial } from '@/contexts/TutorialContext';
import TutorialStep from '@/components/tutorial/TutorialStep';
import {
  MAIN_TOP_NAV_TABS,
  getMainTopNavHighlightKey,
  getMainNavTutorialConfig,
} from '@/lib/mainTopNav';

const roles = {
  ADMIN: 'admin',
  MASTER_ADMIN: 'master-admin',
  DISTRIBUTOR: 'distributor',
  SUB_ADMIN: 'sub-admin',
};

const navItems = [
  { path: '/dashboard?tab=intelligence', icon: Bot, label: 'Copiloto de Vendas', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: '/goals', icon: Target, label: 'Metas', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: '/fnx-solutions', icon: Landmark, label: 'MetriX Bank', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: '/stock', icon: Package, label: 'Estoque', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: '/team', icon: Network, label: 'Painel de Equipe', roles: [roles.SUB_ADMIN] },
  { path: '/mentorship', icon: GraduationCap, label: 'Mentoria', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: '/support', icon: LifeBuoy, label: 'Suporte', roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
];

const adminNavItems = [
  { path: '/admin/dashboard', icon: Home, label: 'Início', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/users', icon: Users, label: 'Usuários', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/activities', icon: Calendar, label: 'Atividades', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/customers', icon: Users, label: 'Clientes', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/stock', icon: Briefcase, label: 'Estoque', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/financial', icon: DollarSign, label: 'Financeiro', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/proposals', icon: BarChart2, label: 'Propostas FNX', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/goals', icon: Briefcase, label: 'Metas', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/journey', icon: GraduationCap, label: 'Jornada', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/mentorship', icon: GraduationCap, label: 'Mentoria', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
  { path: '/admin/support', icon: LifeBuoy, label: 'Suporte', roles: [roles.ADMIN, roles.MASTER_ADMIN] },
];

const mobileBottomBarItems = ['/dashboard', '/sales', '/agenda', '/customers', '/financial'];

function roleLabel(role) {
  if (role === roles.SUB_ADMIN) return 'Sub-administrador';
  if (role === roles.DISTRIBUTOR) return 'Distribuidor';
  if (role === roles.ADMIN || role === roles.MASTER_ADMIN) return 'Administrador';
  return 'Conta';
}

const DashboardHeader = memo(() => {
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const location = useLocation();
  const userRole = user?.role;
  const isAdmin = userRole === roles.ADMIN || userRole === roles.MASTER_ADMIN;
  const homeLink = isAdmin ? '/admin/dashboard' : '/dashboard';
  const showMainTopNav =
    (userRole === roles.DISTRIBUTOR || userRole === roles.SUB_ADMIN) && isDesktop;

  const { isTutorialActive, currentStep, nextStep } = useTutorial();

  const highlightKey = getMainTopNavHighlightKey(location.pathname, location.search);

  const onMainNavClick = useCallback(
    (tabValue) => {
      if (!isTutorialActive) return;
      const stepMap = { performance: 1, crm: 2, agenda: 3 };
      if (currentStep === stepMap[tabValue]) {
        setTimeout(() => nextStep(), 300);
      }
    },
    [isTutorialActive, currentStep, nextStep],
  );

  const getFilteredNavItems = () => {
    if (!userRole) return [];
    let items = [];
    if (userRole === roles.ADMIN || userRole === roles.MASTER_ADMIN)
      items = adminNavItems.filter((item) => item.roles.includes(userRole));
    else {
      items = navItems.filter((item) => item.roles.includes(userRole));
      if (!isDesktop) items = items.filter((item) => !mobileBottomBarItems.includes(item.path));
    }
    return items;
  };

  const filteredNavItems = getFilteredNavItems();
  const isItemActive = (itemPath) =>
    itemPath.includes('?')
      ? location.pathname + location.search === itemPath
      : location.pathname === itemPath;

  return (
    <header className="relative z-10 w-full bg-[color:var(--nocturnal-surface-low)] px-3 py-6 sm:px-5 md:py-8 lg:px-8 lg:py-10">
      <div className="relative mx-auto flex max-w-[1920px] items-center justify-between gap-4 md:gap-8 lg:gap-10">
        <div className="relative z-[12] flex min-w-0 shrink-0 items-center gap-3 md:gap-4">
          {filteredNavItems.length > 0 && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-[#eae1fd] hover:bg-white/5 hover:text-[#eae1fd]"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[85%] flex-col border-r border-white/10 bg-[color:var(--nocturnal-surface-low)] p-0 sm:max-w-xs z-[60]"
              >
                <SheetHeader className="border-b border-white/10 p-4">
                  <SheetTitle className="flex justify-center">
                    <img
                      className="h-20 w-auto"
                      alt="MetriX logo"
                      src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/bb2c8f92-305c-4fa2-b51c-2c1afed92f11-7KcFL.png"
                    />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="flex flex-col gap-1 px-2">
                    {filteredNavItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-white/5',
                          isItemActive(item.path)
                            ? 'bg-[#27223d]/40 text-[#eae1fd]'
                            : 'text-[#aea7c1]',
                        )}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto border-t border-white/10 p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#aea7c1] hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      signOut();
                    }}
                  >
                    <X className="mr-3 h-5 w-5" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <NavLink to={homeLink} className="flex min-w-0 items-center gap-2">
            <img
              className="hidden h-10 w-auto sm:block"
              alt="MetriX logo"
              src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/1ae7e25f-1100-4f17-9abc-8a1d3ec0fab3-fquwp.png-gq7TG.webp"
            />
            <img
              className="h-10 w-auto sm:hidden"
              alt="MetriX icon"
              src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/1ae7e25f-1100-4f17-9abc-8a1d3ec0fab3-fqUWp.png"
            />
          </NavLink>
        </div>

        {showMainTopNav && (
          <nav
            className="pointer-events-none absolute left-1/2 top-1/2 z-[14] hidden -translate-x-1/2 -translate-y-1/2 md:block"
            aria-label="Navegação principal"
          >
            <div
              className="pointer-events-auto flex items-center gap-0.5 overflow-visible rounded-2xl border border-white/5 bg-[#27223d]/50 px-2 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-[30px] sm:gap-1 sm:px-3 sm:py-2"
            >
              {MAIN_TOP_NAV_TABS.map((tab) => {
                const tutorialConfig = getMainNavTutorialConfig(tab.value);
                const isActive = highlightKey === tab.value;
                return (
                  <TutorialStep
                    key={tab.value}
                    step={tutorialConfig.step}
                    content={tutorialConfig.content}
                    isActive={isTutorialActive && currentStep === tutorialConfig.step}
                  >
                    <NavLink
                      to={tab.path}
                      end={tab.path === '/dashboard'}
                      onClick={() => onMainNavClick(tab.value)}
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-1 overflow-visible rounded-xl px-2.5 py-2 text-xs font-medium leading-none transition-colors sm:px-4 sm:text-sm',
                        !isActive && 'text-[#aea7c1] hover:text-[#eae1fd]/90',
                        isActive && 'pb-3',
                      )}
                    >
                      <span className="flex items-center gap-1.5 leading-none sm:gap-2">
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center justify-center overflow-visible p-px [&>svg]:block',
                            isActive ? 'text-[#cfa8ff]' : 'text-current',
                          )}
                        >
                          <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" stroke="currentColor" strokeWidth={2} />
                        </span>
                        <span
                          className={cn(
                            isActive &&
                              'bg-[linear-gradient(135deg,#c799ff,#bc87fe)] bg-clip-text text-transparent',
                          )}
                        >
                          {tab.label}
                        </span>
                      </span>
                      {isActive && (
                        <span
                          className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#a0fff0]"
                          aria-hidden
                        />
                      )}
                    </NavLink>
                  </TutorialStep>
                );
              })}
            </div>
          </nav>
        )}

        <div className="relative z-[13] flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="hidden max-w-[140px] flex-col items-end text-right sm:flex md:max-w-[200px]">
            <span className="truncate text-[10px] uppercase tracking-wider text-[#aea7c1]">
              {roleLabel(userRole)}
            </span>
            <span className="truncate text-sm font-semibold text-[#eae1fd]">{user?.name}</span>
          </div>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 shadow-[0_0_24px_rgba(199,153,255,0.1)] ring-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-[#bc87fe]/40"
              >
                <Avatar className="h-10 w-10 border border-white/10 shadow-none">
                  <AvatarImage
                    src={
                      user?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`
                    }
                  />
                  <AvatarFallback className="bg-[#27223d] text-[#eae1fd]">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[60] w-56 border-white/10 bg-[color:var(--nocturnal-surface-low)] text-[#eae1fd]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-[#aea7c1]">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <NavLink to="/profile" className="flex w-full cursor-pointer items-center focus:bg-white/10">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Minha Conta</span>
                </NavLink>
              </DropdownMenuItem>
              {(userRole === roles.DISTRIBUTOR || userRole === roles.SUB_ADMIN) && (
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="flex w-full cursor-pointer items-center focus:bg-white/10">
                    <Sliders className="mr-2 h-4 w-4" />
                    <span>Integrações</span>
                  </NavLink>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer focus:bg-white/10">
                <X className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
export default DashboardHeader;
