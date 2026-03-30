import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  Bell, Settings, LayoutGrid, LifeBuoy, Search, 
  CalendarDays, ChevronDown, LogOut, User, Menu, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/chartColorScheme';

const ExecutiveHeader = ({ period, setPeriod, toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const { alerts } = useAlertSystem();
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/60">
      <div className="flex h-16 items-center px-4 sm:px-6 gap-4">
        {/* Mobile Menu Trigger */}
        <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white" onClick={toggleSidebar}>
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo Area */}
        <div className="hidden md:flex items-center gap-2 mr-4">
           <div className="h-8 w-8 bg-gradient-to-tr from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">M</span>
           </div>
           <span className="font-bold text-xl tracking-tight text-white">MétriX <span className="text-emerald-500">Executive</span></span>
        </div>

        {/* Global Search & Period Selector */}
        <div className="flex-1 flex items-center gap-4 max-w-2xl">
          <div className="relative flex-1 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar (cmd+k)..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 focus:bg-white/10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400 hidden sm:block" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-slate-200 h-9 rounded-full focus:ring-emerald-500/50 hover:bg-white/10 transition-colors">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10 text-slate-200">
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Strategic Alerts & Actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {/* Strategic Alerts Ticker */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
                {alerts.slice(0, 2).map((alert, idx) => (
                    <Badge 
                        key={alert.id} 
                        variant="outline" 
                        className={cn(
                            "cursor-pointer transition-all gap-1.5 py-1 px-3 border-opacity-30 bg-opacity-10 hover:bg-opacity-20",
                            alert.type === 'critical' ? "border-red-500 bg-red-500 text-red-400" :
                            alert.type === 'warning' ? "border-amber-500 bg-amber-500 text-amber-400" :
                            "border-blue-500 bg-blue-500 text-blue-400"
                        )}
                    >
                        {alert.type === 'critical' && <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>}
                        {alert.message}
                    </Badge>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 sm:gap-2 border-l border-white/10 pl-2 sm:pl-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 relative group">
                    <Bell className="h-5 w-5 group-hover:animate-swing" />
                    {alerts.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></span>}
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 hidden sm:flex">
                    <LayoutGrid className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 hidden sm:flex relative">
                    <LifeBuoy className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">3</span>
                </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white/10 hover:ring-emerald-500/50 transition-all p-0 overflow-hidden">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="bg-emerald-600 text-white font-bold">{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#1e293b] border-white/10 text-slate-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                    <p className="text-xs leading-none text-slate-400">{user?.email}</p>
                    <Badge className="w-fit mt-1 bg-emerald-500/20 text-emerald-300 border-0 text-[10px] uppercase">Master Admin</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-slate-300 focus:text-white">
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-slate-300 focus:text-white">
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={signOut} className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ExecutiveHeader;