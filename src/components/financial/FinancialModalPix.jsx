import React, { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { createPixCharge } from '@/services/financialService';
import { cn } from '@/lib/utils';
import FinancialModalShell from '@/components/financial/FinancialModalShell';
import FinancialFormField from '@/components/financial/FinancialFormField';
import {
  FINANCIAL_MODAL_VARIANTS,
  FINANCIAL_INPUT_CLASS,
} from '@/components/financial/financialModalVariants';

const pixSchema = z.object({
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  payerName: z.string().optional(),
  payerEmail: z
    .string()
    .optional()
    .refine((val) => !val || val.trim() === '' || z.string().email().safeParse(val.trim()).success, {
      message: 'E-mail inválido',
    }),
});

const FORM_ID = 'form-financial-pix';

const FinancialModalPix = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const baseId = useId();
  const v = FINANCIAL_MODAL_VARIANTS.pix;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(pixSchema),
    defaultValues: {
      amount: '',
      description: '',
      payerName: '',
      payerEmail: '',
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        amount: '',
        description: '',
        payerName: '',
        payerEmail: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    try {
      const result = await createPixCharge({
        amount: values.amount,
        description: values.description,
        payerName: values.payerName || undefined,
        payerEmail: values.payerEmail || undefined,
      });
      toast({
        title: 'Cobrança PIX criada',
        description: `Referência: ${result.id}. QR Code e Pix copia-e-cola virão com o Asaas.`,
        variant: 'success',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tente novamente em instantes.';
      toast({ title: 'Não foi possível gerar o PIX', description: message, variant: 'destructive' });
    }
  };

  return (
    <FinancialModalShell
      open={open}
      onOpenChange={onOpenChange}
      variant="pix"
      icon={QrCode}
      title="Cobrança via PIX"
      description="Receba na hora com QR Code e Pix copia-e-cola. Os dados abaixo alimentam a cobrança quando a API Asaas estiver conectada."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:items-center w-full">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground sm:mr-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={isSubmitting}
            className={cn('min-w-[160px] font-semibold', v.primaryBtn)}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 opacity-90" aria-hidden />
            )}
            Gerar cobrança
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FinancialFormField
          id={`${baseId}-amount`}
          label="Valor"
          hint="Use o valor exato a receber em reais."
          error={errors.amount?.message}
          required
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              R$
            </span>
            <Input
              id={`${baseId}-amount`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0,00"
              className={cn(FINANCIAL_INPUT_CLASS, 'pl-10 text-lg font-semibold tabular-nums')}
              aria-invalid={!!errors.amount}
              {...register('amount')}
            />
          </div>
        </FinancialFormField>

        <FinancialFormField
          id={`${baseId}-description`}
          label="Identificação da cobrança"
          hint="Aparece no extrato do pagador e no painel."
          error={errors.description?.message}
          required
        >
          <Input
            id={`${baseId}-description`}
            placeholder="Ex.: Pedido #1234 — Assinatura abril"
            className={FINANCIAL_INPUT_CLASS}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </FinancialFormField>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            <Separator className="flex-1 bg-white/10" />
            Pagador (opcional)
            <Separator className="flex-1 bg-white/10" />
          </div>
          <p className="text-xs text-muted-foreground/90 leading-relaxed">
            Ajuda a personalizar notificações e recibos quando o Asaas estiver integrado.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FinancialFormField id={`${baseId}-payer`} label="Nome" error={errors.payerName?.message}>
              <Input
                id={`${baseId}-payer`}
                placeholder="Nome completo"
                autoComplete="name"
                className={FINANCIAL_INPUT_CLASS}
                {...register('payerName')}
              />
            </FinancialFormField>
            <FinancialFormField id={`${baseId}-email`} label="E-mail" error={errors.payerEmail?.message}>
              <Input
                id={`${baseId}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="email@empresa.com"
                className={FINANCIAL_INPUT_CLASS}
                aria-invalid={!!errors.payerEmail}
                {...register('payerEmail')}
              />
            </FinancialFormField>
          </div>
        </div>
      </form>
    </FinancialModalShell>
  );
};

export default FinancialModalPix;
