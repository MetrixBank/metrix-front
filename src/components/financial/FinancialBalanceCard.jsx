import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Lock, RefreshCw, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialBalanceCard = ({ data, loading, error, onRetry }) => {
  if (loading && !data) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-white/[0.08]',
          'bg-[linear-gradient(135deg,rgba(139,92,246,0.15)_0%,transparent_45%,rgba(34,211,238,0.06)_100%)]',
          'shadow-2xl shadow-violet-950/40 p-8 sm:p-10',
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 flex-1 max-w-md">
            <Skeleton className="h-3.5 w-36 rounded-full" />
            <Skeleton className="h-12 w-56 max-w-full rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-full" />
          </div>
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-3xl border border-red-500/25 bg-red-950/20',
          'shadow-xl shadow-red-950/30 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center',
        )}
      >
        <div>
          <p className="text-sm font-semibold text-red-300">Não foi possível carregar o saldo</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-red-500/30 hover:bg-red-500/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </motion.div>
    );
  }

  const available = data?.available ?? 0;
  const blocked = data?.blocked ?? 0;
  const showBlocked = blocked > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.1]',
        'bg-[linear-gradient(145deg,rgba(88,28,135,0.35)_0%,rgba(15,11,30,0.95)_42%,rgba(15,11,30,0.98)_100%)]',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_-12px_rgba(88,28,135,0.45)]',
        'p-8 sm:p-10',
      )}
    >
      {/* orbs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-violet-500/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-500/15 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200/90">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            Saldo da conta
          </div>
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums [text-shadow:0_2px_40px_rgba(139,92,246,0.35)]">
            {formatCurrency(available)}
          </p>
          <p className="text-sm text-violet-200/70 max-w-md leading-relaxed">
            Disponível para saque e novas cobranças. Integração Asaas refletirá o saldo real em tempo real.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {showBlocked ? (
            <div
              className={cn(
                'flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.07]',
                'px-5 py-4 min-w-[220px] backdrop-blur-sm',
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30">
                <Lock className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
                  Bloqueado
                </p>
                <p className="text-xl font-semibold tabular-nums text-white">{formatCurrency(blocked)}</p>
              </div>
            </div>
          ) : null}

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/30 to-fuchsia-600/20 text-white shadow-inner shadow-violet-500/20">
            <Wallet className="h-9 w-9 opacity-95" aria-hidden />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialBalanceCard;
