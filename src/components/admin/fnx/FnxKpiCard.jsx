import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency, formatNumberWithSuffix } from '@/lib/utils';

const FnxKpiCard = ({ title, value, icon: Icon, description, format = 'integer', trend, className }) => {
  let formattedValue = value;

  if (format === 'currency') {
    formattedValue = formatCurrency(value);
  } else if (format === 'percentage') {
    formattedValue = `${Number(value).toFixed(1).replace('.', ',')}%`;
  } else if (format === 'compact') {
    formattedValue = formatNumberWithSuffix(value);
  }

  return (
    <Card className={cn("overflow-hidden relative border-none shadow-md hover:shadow-lg transition-all duration-200 bg-card", className)}>
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Icon className="w-24 h-24" />
      </div>
      <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full flex items-center",
              trend > 0 ? "text-green-600 bg-green-100 dark:bg-green-900/30" : "text-red-600 bg-red-100 dark:bg-red-900/30"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{formattedValue}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FnxKpiCard;