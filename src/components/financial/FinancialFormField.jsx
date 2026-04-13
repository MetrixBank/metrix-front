import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Campo de formulário com hierarquia visual clara (label uppercase leve, hint, erro com ícone).
 */
const FinancialFormField = ({
  id,
  label,
  hint,
  error,
  children,
  className,
  labelClassName,
  required,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={id}
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90',
            labelClassName,
          )}
        >
          {label}
          {required ? <span className="text-destructive ml-0.5" aria-hidden>*</span> : null}
        </Label>
      </div>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground/80 leading-relaxed">{hint}</p> : null}
      {error ? (
        <p
          className="text-xs font-medium text-destructive flex items-start gap-1.5"
          role="alert"
          id={id ? `${id}-error` : undefined}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
};

export default FinancialFormField;
