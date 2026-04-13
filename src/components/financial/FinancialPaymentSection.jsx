import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, FileText, Link2 } from 'lucide-react';
import { useFinancialBalance } from '@/hooks/useFinancialBalance';
import FinancialBalanceCard from '@/components/financial/FinancialBalanceCard';
import FinancialCard from '@/components/financial/FinancialCard';
import FinancialModalPix from '@/components/financial/FinancialModalPix';
import FinancialModalBoleto from '@/components/financial/FinancialModalBoleto';
import FinancialModalLink from '@/components/financial/FinancialModalLink';

const paymentMethods = [
  {
    variant: 'pix',
    icon: QrCode,
    title: 'PIX',
    description: 'QR Code e copia-e-cola na hora — ideal para vendas rápidas e checkout.',
    modal: 'pix',
  },
  {
    variant: 'boleto',
    icon: FileText,
    title: 'Boleto',
    description: 'Registro e vencimento sob medida para contratos e mensalidades.',
    modal: 'boleto',
  },
  {
    variant: 'link',
    icon: Link2,
    title: 'Link de pagamento',
    description: 'Um link para enviar no WhatsApp, e-mail ou site — compartilhe em segundos.',
    modal: 'link',
  },
];

/**
 * Bloco hero de saldo + meios de cobrança (modais isolados; serviço em financialService).
 */
const FinancialPaymentSection = () => {
  const { data, loading, error, refetch } = useFinancialBalance();
  const [pixOpen, setPixOpen] = useState(false);
  const [boletoOpen, setBoletoOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const openModal = (key) => {
    if (key === 'pix') setPixOpen(true);
    if (key === 'boleto') setBoletoOpen(true);
    if (key === 'link') setLinkOpen(true);
  };

  const handleAfterPaymentAction = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <section className="relative space-y-8" aria-labelledby="financial-hub-heading">
      <div className="pointer-events-none absolute -inset-x-4 -top-4 h-40 bg-gradient-to-b from-primary/[0.07] to-transparent rounded-3xl blur-2xl" />

      <div className="relative space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/90 mb-2">
              Hub financeiro
            </p>
            <h2
              id="financial-hub-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-white/75"
            >
              Seu dinheiro, em um só lugar
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Visualize o saldo da conta e crie cobranças com a mesma experiência que você terá com o Asaas —
              rápido, claro e preparado para escalar.
            </p>
          </div>
        </motion.div>

        <FinancialBalanceCard data={data} loading={loading} error={error} onRetry={refetch} />

        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground/90 mb-4">
            Nova cobrança
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {paymentMethods.map((item, index) => (
              <FinancialCard
                key={item.modal}
                variant={item.variant}
                icon={item.icon}
                title={item.title}
                description={item.description}
                index={index}
                onClick={() => openModal(item.modal)}
              />
            ))}
          </div>
        </div>
      </div>

      <FinancialModalPix open={pixOpen} onOpenChange={setPixOpen} onSuccess={handleAfterPaymentAction} />
      <FinancialModalBoleto open={boletoOpen} onOpenChange={setBoletoOpen} onSuccess={handleAfterPaymentAction} />
      <FinancialModalLink open={linkOpen} onOpenChange={setLinkOpen} onSuccess={handleAfterPaymentAction} />
    </section>
  );
};

export default FinancialPaymentSection;
