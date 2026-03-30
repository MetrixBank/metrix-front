import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Phone } from 'lucide-react';

const LeadsListView = ({ leads, selectedLeadId, onSelect }) => {
  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/5 rounded-lg border border-dashed">
        <User className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium">Nenhum lead encontrado</h3>
        <p className="text-sm text-muted-foreground">Adicione seu primeiro lead para começar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden h-full flex flex-col">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40%]">Nome</TableHead>
              <TableHead className="w-[30%]">Contato</TableHead>
              <TableHead className="w-[30%] text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className={`cursor-pointer transition-colors ${selectedLeadId === lead.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}
                onClick={() => onSelect(lead)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{lead.name}</span>
                    {lead.interests && (
                      <span className="text-xs text-muted-foreground line-clamp-1 truncate max-w-[150px]">
                        {lead.interests}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-2 border-t bg-muted/10 text-xs text-center text-muted-foreground">
        Total: {leads.length} leads
      </div>
    </div>
  );
};

export default LeadsListView;