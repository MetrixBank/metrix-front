import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalization } from '@/contexts/LocalizationContext';
import { ArrowDown, ArrowUp, DollarSign, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LocalizedStatCard = ({ title, value, variant = "default", className }) => {
  const { formatMoney } = useLocalization();

  const getIcon = () => {
    switch (variant) {
      case 'success': return ArrowUp;
      case 'danger': return ArrowDown;
      case 'warning': return DollarSign;
      case 'info': return Wallet;
      default: return BarChart3;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success': return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case 'danger': return "text-red-500 bg-red-500/10 border-red-500/20";
      case 'warning': return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case 'info': return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-primary bg-primary/10 border-primary/20";
    }
  };

  const Icon = getIcon();

  return (
    <Card className={cn("border backdrop-blur-sm bg-card/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", getVariantStyles())}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMoney(value)}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalizedStatCard;