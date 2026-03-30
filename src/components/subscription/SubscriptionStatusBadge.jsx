import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SubscriptionStatusBadge = ({ isPremium, expirationDate, className = '' }) => {
  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 gap-1.5 pl-1.5 pr-2.5 py-1 ${className}`}>
              <div className="bg-white/20 p-0.5 rounded-full">
                <Star className="w-3 h-3 fill-current" />
              </div>
              Premium
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 border-slate-800 text-white">
            <p>
              {expirationDate 
                ? `Renova em ${format(new Date(expirationDate), "dd 'de' MMMM", { locale: ptBR })}`
                : 'Assinatura ativa'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-slate-500 border-slate-300 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 gap-1.5 ${className}`}>
            <Shield className="w-3 h-3" />
            Gratuito
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Plano Básico</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SubscriptionStatusBadge;