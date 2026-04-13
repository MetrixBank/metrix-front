import React from 'react';
import { AlertTriangle, Clock, Thermometer, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TEMP_CONFIG = {
  Hot: { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Zap, label: 'Quente' },
  Warm: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Thermometer, label: 'Morno' },
  Cold: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'Frio' },
  'At Risk': { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Em Risco' },
};

export const TemperatureBadge = ({ temp }) => {
  const style = TEMP_CONFIG[temp] || TEMP_CONFIG.Cold;
  const Icon = style.icon;

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1 border', style.color)}>
      <Icon className="w-3 h-3" /> {style.label}
    </Badge>
  );
};
