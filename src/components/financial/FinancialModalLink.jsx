import React, { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createPaymentLink } from '@/services/financialService';
import { cn } from '@/lib/utils';
import FinancialModalShell from '@/components/financial/FinancialModalShell';
import FinancialFormField from '@/components/financial/FinancialFormField';
import {
  FINANCIAL_MODAL_VARIANTS,
  FINANCIAL_INPUT_CLASS,
} from '@/components/financial/financialModalVariants';

const linkSchema = z.object({
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  name: z.string().optional(),
});

const FORM_ID = 'form-financial-link';

const FinancialModalLink = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const baseId = useId();
  const v = FINANCIAL_MODAL_VARIANTS.link;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      amount: '',
      description: '',
      name: '',
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        amount: '',
        description: '',
        name: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    try {
      const result = await createPaymentLink({
        amount: values.amount,
        description: values.description,
        name: values.name || undefined,
      });
      toast({
        title: 'Link de pagamento criado',
        description: `ID ${result.id}. A URL pública será retornada pela API Asaas.`,
        variant: 'success',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tente novamente em instantes.';
      toast({ title: 'Erro ao criar link', description: message, variant: 'destructive' });
    }
  };

  return (
    <FinancialModalShell
      open={open}
      onOpenChange={onOpenChange}
      variant="link"
      icon={Link2}
      title="Link de pagamento"
      description="Um link único para compartilhar. Meios aceitos (cartão, Pix etc.) seguirão a configuração da sua conta Asaas."
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
              <Share2 className="h-4 w-4 mr-2 opacity-90" aria-hidden />
            )}
            Criar link
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FinancialFormField
          id={`${baseId}-name`}
          label="Nome do link"
          hint="Como você identifica esta cobrança internamente (opcional)."
          error={errors.name?.message}
        >
          <Input
            id={`${baseId}-name`}
            placeholder="Ex.: Assinatura Premium — Anual"
            className={FINANCIAL_INPUT_CLASS}
            {...register('name')}
          />
        </FinancialFormField>

        <FinancialFormField
          id={`${baseId}-amount`}
          label="Valor"
          hint="Valor pré-preenchido no checkout do link."
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
          label="Descrição pública"
          hint="Texto exibido para quem abrir o link."
          error={errors.description?.message}
          required
        >
          <Input
            id={`${baseId}-description`}
            placeholder="Detalhes visíveis na página de pagamento"
            className={FINANCIAL_INPUT_CLASS}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </FinancialFormField>
      </form>
    </FinancialModalShell>
  );
};

export default FinancialModalLink;
