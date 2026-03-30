import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, Send, Save, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MessageSuggestionsPanel from './MessageSuggestionsPanel';
import { supabase } from '@/lib/supabaseClient';

const LeadDetailModal = ({ isOpen, onClose, lead, stages, updateLeadStage, updateLeadNotes, suggestedMessages }) => {
  const [messageText, setMessageText] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  
  useEffect(() => {
    if (lead) {
      setInternalNotes(lead.internal_notes || '');
      fetchHistory(lead.id);
    }
  }, [lead]);

  const fetchHistory = async (leadId) => {
    if (!leadId) return;
    const { data } = await supabase.from('lead_messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: true });
    if (data) setMessageHistory(data);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !lead) return;
    const phone = lead.phone?.replace(/\D/g, '');
    if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
    }
    const { data } = await supabase.from('lead_messages').insert([{ lead_id: lead.id, sender: 'distributor', message: messageText, timestamp: new Date().toISOString() }]).select().single();
    if (data) {
        setMessageHistory([...messageHistory, data]);
        setMessageText('');
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    await updateLeadNotes(lead.id, internalNotes);
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex justify-between items-start">
            <div>
                <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
                    {lead.email && <span className="flex items-center gap-1 ml-2"><Mail className="h-3 w-3" /> {lead.email}</span>}
                </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
                 <Select value={lead.stage_id} onValueChange={(val) => updateLeadStage(lead.id, val)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
                    <SelectContent>
                        {stages.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
            <div className="w-1/3 border-r bg-muted/10 flex flex-col">
                <Tabs defaultValue="details" className="flex-1 flex flex-col">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                        <TabsTrigger value="details">Detalhes</TabsTrigger>
                        <TabsTrigger value="notes">Notas Internas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase">Origem</label><p className="text-sm font-medium">{lead.source || 'Desconhecida'}</p></div>
                            <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase">Criado em</label><p className="text-sm">{lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</p></div>
                            <div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground uppercase">Mensagem Inicial</label><div className="p-3 bg-muted rounded-md text-sm italic">"{lead.message || 'Sem mensagem inicial'}"</div></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="notes" className="flex-1 p-4 flex flex-col gap-2">
                        <Textarea className="flex-1 resize-none bg-background" placeholder="Anote detalhes importantes..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                        <Button size="sm" onClick={handleSaveNotes} className="self-end"><Save className="h-4 w-4 mr-2" /> Salvar Notas</Button>
                    </TabsContent>
                </Tabs>
            </div>
            <div className="w-2/3 flex flex-col bg-background">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messageHistory.length === 0 && (
                            <div className="text-center text-muted-foreground py-10 opacity-50"><MessageCircle className="h-10 w-10 mx-auto mb-2" /><p>Nenhuma mensagem trocada ainda.</p></div>
                        )}
                        {messageHistory.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'distributor' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'distributor' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                    <p className="text-[10px] opacity-70 mt-1 text-right">{format(new Date(msg.timestamp || msg.created_at), "dd/MM HH:mm")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/5">
                     <Tabs defaultValue="write" className="w-full">
                        <div className="flex items-center justify-between mb-2">
                            <TabsList className="h-8"><TabsTrigger value="write" className="text-xs">Escrever</TabsTrigger><TabsTrigger value="suggestions" className="text-xs">Sugestões</TabsTrigger></TabsList>
                            <span className="text-xs text-muted-foreground">Etapa: {stages.find(s => s.id === lead.stage_id)?.name}</span>
                        </div>
                        <TabsContent value="write" className="mt-0">
                            <div className="flex gap-2">
                                <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Digite sua mensagem..." className="min-h-[80px] resize-none" />
                                <Button className="h-auto w-[100px] flex flex-col gap-1" onClick={handleSendMessage}><Send className="h-5 w-5" /><span className="text-xs">Enviar Zap</span></Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="suggestions" className="mt-0">
                             <MessageSuggestionsPanel messages={suggestedMessages} stageId={lead.stage_id} onSelectMessage={(text) => setMessageText(text)} />
                        </TabsContent>
                     </Tabs>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailModal;