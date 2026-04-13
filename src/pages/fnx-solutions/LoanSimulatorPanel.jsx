import React, { useMemo } from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Simulador de crédito (layout alinhado ao mock — sliders + resultados à direita).
 */
const LoanSimulatorPanel = () => {
  const [proposalValue, setProposalValue] = React.useState(3000);
  const [installments, setInstallments] = React.useState(12);

  const simulation = useMemo(() => {
    const MONTHLY_INTEREST_RATE = 0.048;
    const IOF_RATE = 0.02;
    const BOLETO_FEE = 2.99;

    const productCost = proposalValue / 2;
    const distributorProfit = proposalValue / 2;

    const totalIof = proposalValue * IOF_RATE;
    const totalBoletoFees = installments * BOLETO_FEE;
    const financingValueForClient = proposalValue + totalIof + totalBoletoFees;

    const monthlyInstallment =
      financingValueForClient > 0 && installments > 0
        ? (financingValueForClient *
            (MONTHLY_INTEREST_RATE * Math.pow(1 + MONTHLY_INTEREST_RATE, installments))) /
          (Math.pow(1 + MONTHLY_INTEREST_RATE, installments) - 1)
        : 0;

    const costCoverage = Math.min(productCost * 1.2, financingValueForClient * 0.45);
    const profitDisplay = distributorProfit / Math.max(installments, 1) * 4.5;

    return {
      monthlyInstallment,
      costCoverage,
      profitDisplay: Math.max(profitDisplay, 0),
      boletoFee: BOLETO_FEE,
    };
  }, [proposalValue, installments]);

  return (
    <div
      className={cn(
        'rounded-[20px] border border-white/[0.08] bg-[#14121c]/90 backdrop-blur-xl',
        'shadow-[0_0_60px_-20px_rgba(168,85,247,0.25)] overflow-hidden',
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 p-6 sm:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
          <div className="space-y-3">
            <div className="flex justify-between items-baseline gap-4">
              <Label className="text-[#94A3B8] text-sm font-medium">Valor da proposta</Label>
              <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                {formatCurrency(proposalValue)}
              </span>
            </div>
            <Slider
              min={1000}
              max={50000}
              step={100}
              value={[proposalValue]}
              onValueChange={(v) => setProposalValue(v[0])}
              className="[&_[role=slider]]:h-2 [&_.bg-primary]:bg-[#A855F7] [&_[data-radix-collection-item]]:h-5 [&_[data-radix-collection-item]]:w-5 [&_[data-radix-collection-item]]:border-2 [&_[data-radix-collection-item]]:border-white [&_[data-radix-collection-item]]:shadow-[0_0_20px_rgba(168,85,247,0.8)]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>R$ 1.000</span>
              <span>R$ 50.000</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline gap-4">
              <Label className="text-[#94A3B8] text-sm font-medium">Nº de parcelas</Label>
              <span className="text-2xl font-bold text-white">{installments}x</span>
            </div>
            <Slider
              min={1}
              max={48}
              step={1}
              value={[installments]}
              onValueChange={(v) => setInstallments(v[0])}
              className="[&_[role=slider]]:h-2 [&_.bg-primary]:bg-[#A855F7] [&_[data-radix-collection-item]]:h-5 [&_[data-radix-collection-item]]:w-5 [&_[data-radix-collection-item]]:border-2 [&_[data-radix-collection-item]]:border-white [&_[data-radix-collection-item]]:shadow-[0_0_20px_rgba(168,85,247,0.8)]"
            />
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>1x</span>
              <span>48x</span>
            </div>
          </div>
        </div>

        <div className="lg:w-[min(100%,420px)] p-6 sm:p-8 space-y-4 bg-[#0f0d14]/80">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#A855F7]/20 text-[#B589FF]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] font-medium">Parcela para o cliente final</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {formatCurrency(simulation.monthlyInstallment)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#94A3B8] font-medium">Cobertura do custo</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {formatCurrency(simulation.costCoverage)}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-[#2DD4BF]/15 text-[#5EEAD4] border border-[#2DD4BF]/30">
                Optimized
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-l-4 border-[#5EEAD4] border-y border-r border-white/10 bg-[#5EEAD4]/5 p-4 flex gap-3"
          >
            <Sparkles className="h-5 w-5 text-[#5EEAD4] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#94A3B8] font-medium">Recebimento do seu lucro</p>
              <p className="text-xl font-bold text-[#5EEAD4] tabular-nums">
                {formatCurrency(simulation.profitDisplay)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoanSimulatorPanel;
