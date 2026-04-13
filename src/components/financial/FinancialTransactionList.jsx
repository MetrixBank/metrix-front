import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingBag, Camera, Coffee } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const icons = [ShoppingBag, Camera, Coffee];

/**
 * Lista estilo mock (ícone circular, título, subtítulo, valor).
 */
const FinancialTransactionList = ({ entries, onSelectEntry, max = 6 }) => {
  const list = (entries || []).slice(0, max);

  if (list.length === 0) {
    return (
      <p className="text-sm text-[#94A3B8] py-8 text-center">Nenhum lançamento no período.</p>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {list.map((entry, i) => {
        const Icon = icons[i % icons.length];
        const isIncome = entry.type === 'income';
        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelectEntry?.(entry)}
              className="w-full flex items-center gap-4 py-4 text-left hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition-colors"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/10">
                <Icon className="h-5 w-5 text-[#94A3B8]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{entry.description}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {format(new Date(entry.due_date), "d MMM yyyy", { locale: ptBR })} ·{' '}
                  {entry.expense_category || entry.income_category || 'Geral'}
                </p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums shrink-0',
                  isIncome ? 'text-[#5EEAD4]' : 'text-white',
                )}
              >
                {isIncome ? '+ ' : '- '}
                {formatCurrency(entry.amount)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default FinancialTransactionList;
