import React, { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createBoleto } from '@/services/financialService';
import { cn } from '@/lib/utils';
import FinancialModalShell from '@/components/financial/FinancialModalShell';
import FinancialFormField from '@/components/financial/FinancialFormField';
import {
  FINANCIAL_MODAL_VARIANTS,
  FINANCIAL_INPUT_CLASS,
} from '@/components/financial/financialModalVariants';

const boletoSchema = z.object({
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  dueDate: z.string().min(1, 'Informe o vencimento'),
});

const FORM_ID = 'form-financial-boleto';

const FinancialModalBoleto = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const baseId = useId();
  const v = FINANCIAL_MODAL_VARIANTS.boleto;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(boletoSchema),
    defaultValues: {
      amount: '',
      description: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        amount: '',
        description: '',
        dueDate: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    try {
      const result = await createBoleto({
        amount: values.amount,
        description: values.description,
        dueDate: values.dueDate,
      });
      toast({
        title: 'Boleto gerado',
        description: `Referência: ${result.id}. PDF e linha digitável serão retornados pela API Asaas.`,
        variant: 'success',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Tente novamente em instantes.';
      toast({ title: 'Erro ao gerar boleto', description: message, variant: 'destructive' });
    }
  };

  return (
    <FinancialModalShell
      open={open}
      onOpenChange={onOpenChange}
      variant="boleto"
      icon={FileText}
      title="Boleto bancário"
      description="Defina valor e vencimento. O PDF com código de barras e linha digitável serão emitidos quando o Asaas estiver ativo."
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
              <FileText className="h-4 w-4 mr-2 opacity-90" aria-hidden />
            )}
            Gerar boleto
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FinancialFormField
            id={`${baseId}-amount`}
            label="Valor"
            hint="Valor nominal do boleto."
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
            id={`${baseId}-due`}
            label="Vencimento"
            hint="Data limite para pagamento."
            error={errors.dueDate?.message}
            required
          >
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id={`${baseId}-due`}
                type="date"
                className={cn(FINANCIAL_INPUT_CLASS, 'pl-10 [color-scheme:dark]')}
                aria-invalid={!!errors.dueDate}
                {...register('dueDate')}
              />
            </div>
          </FinancialFormField>
        </div>

        <FinancialFormField
          id={`${baseId}-description`}
          label="Descrição / beneficiário"
          hint="Texto de referência no boleto e nos e-mails."
          error={errors.description?.message}
          required
        >
          <Input
            id={`${baseId}-description`}
            placeholder="Ex.: Mensalidade — Plano Pro"
            className={FINANCIAL_INPUT_CLASS}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </FinancialFormField>
      </form>
    </FinancialModalShell>
  );
};

export default FinancialModalBoleto;
