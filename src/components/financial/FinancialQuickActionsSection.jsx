import React, { useCallback, useState } from 'react';
import { QrCode, FileText, Link2, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import FinancialModalPix from '@/components/financial/FinancialModalPix';
import FinancialModalBoleto from '@/components/financial/FinancialModalBoleto';
import FinancialModalLink from '@/components/financial/FinancialModalLink';
import { cn } from '@/lib/utils';

const items = [
  {
    key: 'pix',
    icon: QrCode,
    title: 'PIX Atelier',
    description: 'Liquidação instantânea com as menores taxas do mercado.',
  },
  {
    key: 'boleto',
    icon: FileText,
    title: 'Boleto Premium',
    description: 'Emissão de faturas personalizadas com seu branding exclusivo.',
  },
  {
    key: 'link',
    icon: Link2,
    title: 'Link de Pagamento',
    description: 'Envie cobranças de luxo via WhatsApp ou E-mail com facilidade.',
  },
];

/**
 * Cards de ação (PIX, Boleto, Link) + opcional Empréstimo (MetriX Bank).
 */
const FinancialQuickActionsSection = ({ onPaymentSuccess, onOpenLoanSimulator }) => {
  const [pixOpen, setPixOpen] = useState(false);
  const [boletoOpen, setBoletoOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const open = (key) => {
    if (key === 'pix') setPixOpen(true);
    if (key === 'boleto') setBoletoOpen(true);
    if (key === 'link') setLinkOpen(true);
    if (key === 'loan') onOpenLoanSimulator?.();
  };

  const handleSuccess = useCallback(() => {
    onPaymentSuccess?.();
  }, [onPaymentSuccess]);

  const loanCard = onOpenLoanSimulator
    ? [
        {
          key: 'loan',
          icon: Landmark,
          title: 'Empréstimo',
          description: 'Simule crédito, propostas e acompanhe aprovações em um só lugar.',
        },
      ]
    : [];

  const allItems = [...items, ...loanCard];

  return (
    <section aria-label="Meios de pagamento">
      <div
        className={cn(
          'grid gap-4',
          loanCard.length ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3',
        )}
      >
        {allItems.map((item, index) => (
          <motion.button
            key={item.key}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => open(item.key)}
            className={cn(
              'text-left rounded-[16px] border border-white/[0.08] bg-[#1A1625] p-5',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]',
              'hover:border-[#B589FF]/30 hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.2)]',
              'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B589FF]/50',
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B589FF]/15 ring-1 ring-[#B589FF]/25 shadow-[0_0_24px_-4px_rgba(181,137,255,0.45)] mb-4">
              <item.icon className="h-5 w-5 text-[#B589FF]" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">{item.description}</p>
          </motion.button>
        ))}
      </div>

      <FinancialModalPix open={pixOpen} onOpenChange={setPixOpen} onSuccess={handleSuccess} />
      <FinancialModalBoleto open={boletoOpen} onOpenChange={setBoletoOpen} onSuccess={handleSuccess} />
      <FinancialModalLink open={linkOpen} onOpenChange={setLinkOpen} onSuccess={handleSuccess} />
    </section>
  );
};

export default FinancialQuickActionsSection;
