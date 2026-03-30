import React from 'react';
import { cva } from 'class-variance-authority';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import AnimatedCounter from '@/components/management/goals/AnimatedCounter';
import { DollarSign, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

const cardVariants = cva('transition-all hover:shadow-xl hover:-translate-y-1', {
  variants: {
    variant: {
      default: 'bg-card/60 backdrop-blur-sm border-border/30 text-primary',
      success: 'bg-green-900/30 border-green-800 text-green-400',
      warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-400',
      danger: 'bg-red-900/30 border-red-800 text-red-400',
      info: 'bg-blue-900/30 border-blue-800 text-blue-400',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const iconVariants = cva('h-5 w-5', {
  variants: {
    variant: {
      default: 'text-primary',
      success: 'text-green-400',
      warning: 'text-yellow-400',
      danger: 'text-red-400',
      info: 'text-blue-400',
    },
  },
  defaultVariants: {
      variant: 'default',
  },
});


const icons = {
  default: DollarSign,
  success: TrendingUp,
  danger: TrendingDown,
  info: ArrowDown,
  warning: ArrowUp,
}

const FinancialStatCard = ({ title, value, variant = 'default', loading, className }) => {
  const Icon = icons[variant] || DollarSign;

  return (
    <Card className={cn(cardVariants({ variant }), className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={cn(iconVariants({ variant }))} />
        </CardHeader>
        <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold text-foreground">
                    <AnimatedCounter value={value} formatFunc={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default FinancialStatCard;