import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

/**
 * Linha de 4 métricas do mock com setas e percentuais.
 * Opcional: `proposalsMadeCount` — 5ª métrica (MetriX Bank).
 */
const FinancialStatRow = ({ income, expense, balance, netProfit, loading, proposalsMadeCount }) => {
  const stats = [
    {
      label: 'Entradas',
      value: income,
      trend: 12,
      up: true,
      valueClass: 'text-white',
      currency: true,
    },
    {
      label: 'Saídas',
      value: expense,
      trend: 4,
      up: false,
      valueClass: 'text-white',
      currency: true,
    },
    {
      label: 'Saldo médio',
      value: balance,
      trend: 2,
      up: true,
      valueClass: 'text-white',
      currency: true,
    },
    {
      label: 'Lucro líquido',
      value: netProfit,
      trend: 8,
      up: true,
      valueClass: 'text-white',
      currency: true,
    },
  ];

  if (typeof proposalsMadeCount === 'number') {
    stats.push({
      label: 'Propostas feitas',
      value: proposalsMadeCount,
      trend: 12,
      up: true,
      valueClass: 'text-white',
      currency: false,
    });
  }

  const colCount = stats.length;

  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          colCount >= 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {Array.from({ length: colCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-[16px] border border-white/[0.08] bg-[#1A1625] p-5 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      id="financial-stats"
      className={cn(
        'grid gap-4',
        colCount >= 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            'rounded-[16px] border border-white/[0.08] bg-[#1A1625] p-5',
            'shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]',
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8] mb-2">{s.label}</p>
          <p className={cn('text-2xl font-bold tabular-nums', s.valueClass)}>
            {s.currency ? formatCurrency(s.value) : s.value}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm font-medium">
            {s.up ? (
              <span className="flex items-center text-[#5EEAD4]">
                <ArrowUp className="h-4 w-4 mr-0.5" />
                {s.trend}%
              </span>
            ) : (
              <span className="flex items-center text-red-400">
                <ArrowDown className="h-4 w-4 mr-0.5" />
                {s.trend}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialStatRow;
