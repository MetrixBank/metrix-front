import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Card hero do mock: saldo disponível + ações | bloqueado + próximo recebimento + meta.
 */
const FinancialHeroCard = ({ data, loading, error, refetch, onVerDetalhes, entries }) => {
  const nextReceipt = React.useMemo(() => {
    const pendingIncome = (entries || [])
      .filter((e) => e.type === 'income' && e.status === 'pending' && e.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
    if (pendingIncome?.due_date) {
      return format(new Date(pendingIncome.due_date), "d MMM", { locale: ptBR });
    }
    return '12 Mai';
  }, [entries]);

  if (loading && !data) {
    return (
      <div
        className={cn(
          'rounded-[20px] border border-white/[0.08] bg-[#1A1625] p-6 sm:p-8',
          'shadow-[0_0_60px_-12px_rgba(168,85,247,0.15)]',
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-8">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-3 w-40 bg-white/10" />
            <Skeleton className="h-14 w-64 max-w-full bg-white/10" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-32 rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="lg:w-[min(100%,380px)] space-y-4">
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-2 w-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-red-500/20 bg-[#1A1625] p-6 text-sm text-[#94A3B8]">
        {error}{' '}
        <button type="button" className="text-[#B589FF] underline" onClick={refetch}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const available = data?.available ?? 0;
  const blocked = data?.blocked ?? 0;

  return (
    <div
      className={cn(
        'rounded-[20px] border border-white/[0.08] bg-[#1A1625] p-6 sm:p-8',
        'shadow-[0_0_60px_-12px_rgba(168,85,247,0.12)]',
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-8 lg:gap-12">
        <div className="flex-1 min-w-0 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Saldo disponível</p>
          <p className="text-4xl sm:text-5xl font-bold text-white tabular-nums tracking-tight">
            {formatCurrency(available)}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="button"
              onClick={onVerDetalhes}
              className="rounded-xl bg-[#B589FF] text-[#0D0B14] hover:bg-[#c9a8ff] font-semibold px-6 h-11 border-0"
            >
              Ver detalhes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-white/15 bg-transparent text-white hover:bg-white/5 h-11 gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="lg:w-[min(100%,400px)] flex flex-col justify-between gap-5 border-t border-white/[0.06] lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0 pt-6">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Saldo bloqueado</p>
              <p className="text-xl font-semibold text-white tabular-nums mt-1">{formatCurrency(blocked)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Próximo recebimento</p>
              <p className="text-lg font-medium text-white mt-1 capitalize">{nextReceipt}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={75} className="h-1.5 bg-white/10" indicatorClassName="bg-[#5EEAD4]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
              Meta de faturamento: 75% atingida
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialHeroCard;
