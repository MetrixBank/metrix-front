import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ClientHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gradient sm:text-3xl">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Sincronização em tempo real ativa.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);
