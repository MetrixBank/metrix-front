import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { FINANCIAL_MODAL_VARIANTS } from '@/components/financial/financialModalVariants';

/**
 * Shell premium para modais financeiros: hero com gradiente, linha de acento, animação de entrada.
 * Boas práticas: estrutura semântica, região nomeada, fundo com profundidade.
 */
const FinancialModalShell = ({
  open,
  onOpenChange,
  variant,
  icon: Icon,
  title,
  description,
  children,
  footer,
  contentClassName,
}) => {
  const v = FINANCIAL_MODAL_VARIANTS[variant] ?? FINANCIAL_MODAL_VARIANTS.pix;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'gap-0 p-0 overflow-hidden max-w-[min(100vw-1.25rem,28rem)] sm:max-w-[26.5rem]',
          'border border-white/10 bg-[hsl(222.2_84%_4.9%)]/95 shadow-2xl shadow-black/50',
          'backdrop-blur-xl',
          contentClassName,
        )}
      >
        <div className="relative max-h-[min(90vh,720px)] flex flex-col">
          {/* faixa superior animada */}
          <div
            className={cn('h-1 w-full bg-gradient-to-r shrink-0', v.topLine)}
            aria-hidden
          />

          <div
            className={cn(
              'relative px-5 pt-6 pb-5 border-b border-white/[0.06]',
              'bg-gradient-to-br',
              v.gradient,
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(ellipse_90%_80%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]" />
            <DialogHeader className="relative space-y-3 text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="flex items-start gap-4"
              >
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                    v.iconGlow,
                  )}
                >
                  {Icon ? <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden /> : null}
                </div>
                <div className="min-w-0 space-y-1.5 pt-0.5">
                  <span
                    className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70"
                  >
                    {v.tag}
                  </span>
                  <DialogTitle className="text-xl font-semibold tracking-tight text-foreground leading-snug pr-8">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </DialogDescription>
                </div>
              </motion.div>
            </DialogHeader>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
          >
            {children}
          </motion.div>

          {footer ? (
            <div className="shrink-0 border-t border-white/[0.06] bg-black/20 px-5 py-4 backdrop-blur-md">
              {footer}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialModalShell;
