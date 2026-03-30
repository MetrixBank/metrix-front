import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Phone, 
  MessageSquare, 
  Search,
  AlertTriangle,
} from 'lucide-react';
import AreaHeader from '@/components/ui/AreaHeader';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const FunnelIntelligencePage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Delete State
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch contacts or leads that are relevant
      let query = supabase
        .from('contacts')
        .select('id, phone, name, last_message, last_message_date, funnel_stage, updated_at')
        .eq('distributor_id', user.id)
        .order('last_message_date', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Erro ao carregar contatos",
        description: "Não foi possível carregar a lista de contatos."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('message_history')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar o histórico."
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactToDelete.id);

      if (error) throw error;

      toast({
        title: "Contato excluído",
        description: "O contato e seu histórico foram removidos."
      });

      setContacts(contacts.filter(c => c.id !== contactToDelete.id));
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o contato."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenContact = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
    fetchMessages(contact.id);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return '-';
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const filteredContacts = contacts.filter(contact => 
    (contact.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (contact.phone?.includes(searchTerm))
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      <AreaHeader 
        icon={MessageSquare}
        title="Funil + CRM Assistido"
        subtitle="Gerencie seu funil de vendas assistido por IA"
        actionButton={{
          label: "Atualizar Lista",
          icon: RefreshCw,
          onClick: fetchContacts
        }}
      />

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center gap-4 bg-[#1E293B] p-4 rounded-lg border border-[#334155]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input 
              placeholder="Buscar por nome ou telefone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0F172A] border-[#334155] text-[#E2E8F0] focus:ring-blue-600 focus:border-blue-600 placeholder:text-[#64748B]"
            />
          </div>
          <div className="text-sm text-[#94A3B8]">
            Total: {filteredContacts.length} contatos
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden shadow-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-[#94A3B8]">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
              <p>Carregando contatos...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-red-400">
              <AlertTriangle className="h-10 w-10 mb-4 opacity-50" />
              <p className="mb-4 font-medium">{error}</p>
              <Button onClick={fetchContacts} variant="outline" className="border-red-800 hover:bg-red-950/50 text-red-400">
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
              </Button>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-[#94A3B8]">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-[#E2E8F0]">Nenhum contato encontrado</p>
              <p className="text-sm opacity-60 max-w-xs text-center mt-2">
                Suas conversas do WhatsApp aparecerão aqui automaticamente quando integradas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#0F172A]">
                  <TableRow className="hover:bg-[#0F172A] border-[#334155]">
                    <TableHead className="text-[#94A3B8] font-medium">Nome</TableHead>
                    <TableHead className="text-[#94A3B8] font-medium">Telefone</TableHead>
                    <TableHead className="text-[#94A3B8] font-medium">Estágio</TableHead>
                    <TableHead className="text-[#94A3B8] font-medium w-1/3">Última Mensagem</TableHead>
                    <TableHead className="text-[#94A3B8] font-medium">Data/Hora</TableHead>
                    <TableHead className="text-[#94A3B8] font-medium text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="border-[#334155] hover:bg-[#334155]/50 transition-colors group">
                      <TableCell className="font-medium text-[#E2E8F0]">
                        {contact.name || 'Desconhecido'}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] font-mono text-xs">
                        {contact.phone}
                      </TableCell>
                       <TableCell>
                        <Badge variant="outline" className="border-[#475569] text-[#CBD5E1] bg-[#1E293B]">
                          {contact.funnel_stage || 'Novo Lead'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#94A3B8] max-w-xs truncate">
                        {contact.last_message || <span className="italic opacity-50">Sem mensagens</span>}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-xs whitespace-nowrap">
                        {formatDate(contact.last_message_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenContact(contact)}
                            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setContactToDelete(contact);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* View Contact Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1E293B] border-[#334155] text-[#E2E8F0] max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
          <DialogHeader className="p-4 border-b border-[#334155] bg-[#0F172A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 border border-blue-800">
                  <span className="font-bold">{selectedContact?.name?.[0]?.toUpperCase() || '#'}</span>
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#E2E8F0]">
                    {selectedContact?.name || 'Contato'}
                  </DialogTitle>
                  <DialogDescription className="text-[#94A3B8] flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {selectedContact?.phone}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-[#475569] text-[#94A3B8] bg-[#1E293B]">
                Histórico
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden bg-[#0F172A] relative">
             {/* Chat Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
             
             <ScrollArea className="h-full p-4">
               {loadingMessages ? (
                 <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8] gap-2">
                   <Loader2 className="h-6 w-6 animate-spin" />
                   <span className="text-sm">Carregando mensagens...</span>
                 </div>
               ) : messages.length === 0 ? (
                 <div className="text-center py-12 text-[#94A3B8]">
                   <p>Nenhuma mensagem encontrada neste histórico.</p>
                 </div>
               ) : (
                 <div className="space-y-4 pb-4">
                   {messages.map((msg) => {
                     const isOutbound = msg.direction === 'outbound';
                     return (
                       <div 
                         key={msg.id} 
                         className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}
                       >
                         <div className={`
                           max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group
                           ${isOutbound 
                             ? 'bg-blue-600 text-white rounded-tr-sm' 
                             : 'bg-[#1E293B] text-[#E2E8F0] rounded-tl-sm border border-[#334155]'}
                         `}>
                           <p className="whitespace-pre-wrap leading-relaxed">{msg.message_content}</p>
                           <div className={`
                             text-[10px] mt-1 flex items-center justify-end gap-1
                             ${isOutbound ? 'text-blue-200' : 'text-[#94A3B8]'}
                           `}>
                             {formatDate(msg.created_at || msg.message_date)}
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </ScrollArea>
          </div>
          
          <div className="p-4 border-t border-[#334155] bg-[#0F172A] flex justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#E2E8F0] hover:bg-[#334155] hover:text-white">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-[#334155] text-[#E2E8F0] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Excluir Contato
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8] pt-2">
              Tem certeza que deseja excluir <strong>{contactToDelete?.name}</strong>?
              <br/><br/>
              Esta ação removerá o contato e <strong>todo o histórico de mensagens</strong> permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting} className="text-[#E2E8F0] hover:bg-[#334155]">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteContact} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir Permanentemente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelIntelligencePage;