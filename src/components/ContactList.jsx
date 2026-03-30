// Task 6: ContactList component with complete info and validation
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Phone, Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContactList = ({ contacts, loading, onSelectContact }) => {
  const getStageColor = (stage) => {
    switch (stage) {
      case 'Novo Lead': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Em Contato': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Agendado': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Venda Realizada': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Perdido': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return '-';
      return format(date, "dd/MM HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Carregando contatos...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-800 rounded-lg bg-slate-900/50">
        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-400">Nenhum contato válido encontrado</p>
        <p className="text-sm opacity-60 mt-2 max-w-sm text-center">
          Aguardando novos contatos via webhook. Certifique-se que Nome e Telefone estão presentes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <Table>
        <TableHeader className="bg-slate-950">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-400 font-medium">Nome</TableHead>
            <TableHead className="text-slate-400 font-medium">Telefone</TableHead>
            <TableHead className="text-slate-400 font-medium">Estágio</TableHead>
            <TableHead className="text-slate-400 font-medium w-[40%]">Última Mensagem</TableHead>
            <TableHead className="text-slate-400 font-medium text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="border-slate-800 hover:bg-slate-800/40 transition-colors cursor-pointer group"
              onClick={() => onSelectContact(contact)}
            >
              <TableCell className="font-medium text-slate-200">
                {contact.name}
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 opacity-50" />
                    {contact.phone}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`border-0 ${getStageColor(contact.funnel_stage)}`}>
                  {contact.funnel_stage || 'Novo Lead'}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                <div className="flex flex-col gap-1">
                    <div className="truncate max-w-[300px]" title={contact.last_message}>
                        {contact.last_message || <span className="opacity-30 italic">Sem mensagens</span>}
                    </div>
                    {contact.last_message_date && (
                        <div className="flex items-center gap-1 text-[10px] opacity-60">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contact.last_message_date)}
                        </div>
                    )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContactList;