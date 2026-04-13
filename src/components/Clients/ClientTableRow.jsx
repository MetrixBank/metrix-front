import React from 'react';
import { Edit, Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, formatDate, formatCpfCnpj } from '@/lib/utils';
import { TemperatureBadge } from './TemperatureBadge';

export const ClientTableRow = ({ customer, columns, onEdit, onDelete }) => (
  <TableRow
    className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-secondary/30"
    onClick={onEdit}
  >
    {columns.find((c) => c.id === 'name' && c.visible) && (
      <TableCell className="font-medium text-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-border/40">
            <AvatarFallback className="bg-secondary/50 text-[10px] text-muted-foreground">
              {customer.name?.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span>{customer.name}</span>
        </div>
      </TableCell>
    )}
    {columns.find((c) => c.id === 'cpf' && c.visible) && (
      <TableCell className="font-mono text-xs text-muted-foreground">
        {customer.cpf_cnpj ? formatCpfCnpj(customer.cpf_cnpj) : '-'}
      </TableCell>
    )}
    {columns.find((c) => c.id === 'phone' && c.visible) && (
      <TableCell className="text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3 opacity-50" /> {customer.phone || '-'}
        </span>
      </TableCell>
    )}
    {columns.find((c) => c.id === 'contact' && c.visible) && (
      <TableCell>
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3 opacity-50" /> {customer.email || '-'}
          </span>
        </div>
      </TableCell>
    )}
    {columns.find((c) => c.id === 'address' && c.visible) && (
      <TableCell>
        <div className="flex max-w-[200px] items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 opacity-50" />
          <span
            title={[
              customer.address,
              customer.address_number,
              customer.address_neighborhood,
              customer.address_city,
              customer.address_state,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            {[
              customer.address,
              customer.address_number,
              customer.address_neighborhood,
              customer.address_city,
              customer.address_state,
            ]
              .filter(Boolean)
              .join(', ') || '-'}
          </span>
        </div>
      </TableCell>
    )}
    {columns.find((c) => c.id === 'temperature' && c.visible) && (
      <TableCell>
        <TemperatureBadge temp={customer.intelligence.temperature} />
      </TableCell>
    )}
    {columns.find((c) => c.id === 'score' && c.visible) && (
      <TableCell>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full ${
                customer.intelligence.score > 70
                  ? 'bg-emerald-500'
                  : customer.intelligence.score > 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${customer.intelligence.score}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{customer.intelligence.score}</span>
        </div>
      </TableCell>
    )}
    {columns.find((c) => c.id === 'ltv' && c.visible) && (
      <TableCell className="font-mono text-xs font-medium text-emerald-400">
        {formatCurrency(customer.intelligence.totalPurchased)}
      </TableCell>
    )}
    {columns.find((c) => c.id === 'last_sale' && c.visible) && (
      <TableCell className="text-xs text-muted-foreground">
        {customer.intelligence.lastSaleDate ? formatDate(customer.intelligence.lastSaleDate) : '-'}
      </TableCell>
    )}
    <TableCell className="text-right">
      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);
