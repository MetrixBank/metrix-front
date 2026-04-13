import React from 'react';
import { Inbox } from 'lucide-react';

export const ClientEmptyState = ({ title, description, icon: Icon = Inbox }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30 px-6 py-12 text-center card-gradient">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
      <Icon className="h-8 w-8 text-primary/70" strokeWidth={1.25} />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
  </div>
);
