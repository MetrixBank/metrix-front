import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Fingerprint,
  Phone,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatDate, formatCpfCnpj } from '@/lib/utils';
import { TemperatureBadge } from './TemperatureBadge';

export const ClientCard = ({ customer, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02 }}
    onClick={onEdit}
    className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-5 shadow-lg backdrop-blur-md transition-all hover:border-primary/25 hover:shadow-primary/10"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

    <div className="relative z-10">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
            <AvatarFallback className="bg-primary/20 text-xs text-primary-foreground">
              {customer.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 overflow-hidden">
            <h3 className="max-w-[140px] truncate text-sm font-bold text-foreground">{customer.name}</h3>
            <span className="mt-0.5 flex items-center truncate text-[10px] text-muted-foreground">
              <Phone className="mr-1 h-3 w-3 shrink-0" /> {customer.phone || 'N/A'}
            </span>
          </div>
        </div>
        <TemperatureBadge temp={customer.intelligence.temperature} />
      </div>

      <div className="mb-2 truncate text-[10px] text-muted-foreground">
        <Fingerprint className="mr-1 inline h-3 w-3 opacity-50" />
        {customer.cpf_cnpj ? formatCpfCnpj(customer.cpf_cnpj) : 'CPF não informado'}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/30 bg-background/50 p-2">
          <p className="text-[9px] uppercase text-muted-foreground">Total comprado</p>
          <p className="text-xs font-bold text-emerald-400">{formatCurrency(customer.intelligence.totalPurchased)}</p>
        </div>
        <div className="rounded-lg border border-border/30 bg-background/50 p-2">
          <p className="text-[9px] uppercase text-muted-foreground">Score</p>
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-primary">{customer.intelligence.score}</p>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Última: {customer.intelligence.lastSaleDate ? formatDate(customer.intelligence.lastSaleDate) : '-'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </motion.div>
);
