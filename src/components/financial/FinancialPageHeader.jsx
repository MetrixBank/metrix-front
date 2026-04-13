import React from 'react';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Cabeçalho da página Financeiro alinhado ao mock (título + sino + Elite Member).
 */
const FinancialPageHeader = ({
  title = 'Financeiro',
  subtitle = 'Gerencie seu fluxo de caixa e resultados com precisão editorial.',
}) => {
  const { user } = useAuth();
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-sm text-[#94A3B8] max-w-xl leading-relaxed">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1625] border border-white/10">
          <NotificationBell />
        </div>
        <div className="flex items-center gap-3 rounded-full bg-[#1A1625] border border-white/10 pl-1 pr-3 py-1">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
            <AvatarFallback className="bg-[#2e1064] text-[#B589FF] text-sm font-semibold">{initial}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-[#B589FF] whitespace-nowrap">Elite Member</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialPageHeader;
