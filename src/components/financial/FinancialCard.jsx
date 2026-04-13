import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FINANCIAL_MODAL_VARIANTS } from '@/components/financial/financialModalVariants';

/**
 * Card clicável premium — gradiente sutil, brilho no hover e hierarquia clara.
 */
const FinancialCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'pix',
  index = 0,
  className,
}) => {
  const v = FINANCIAL_MODAL_VARIANTS[variant] ?? FINANCIAL_MODAL_VARIANTS.pix;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl text-left',
        'border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent',
        'shadow-lg shadow-black/20 backdrop-blur-md',
        'transition-[box-shadow,border-color,transform] duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0b1e]',
        v.cardHover,
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
          'bg-gradient-to-br',
          v.gradient,
        )}
      />
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-60" />

      <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-5">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105',
            v.iconGlow,
          )}
        >
          {Icon ? <Icon className="h-7 w-7" strokeWidth={1.65} aria-hidden /> : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="h-3 w-3 text-amber-300/90" aria-hidden />
              {v.tag}
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-muted-foreground/90">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end sm:self-center">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20',
              'text-muted-foreground transition-all duration-300',
              'group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-foreground',
            )}
          >
            <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default FinancialCard;
