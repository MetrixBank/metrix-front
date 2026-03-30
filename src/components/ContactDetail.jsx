// Task 7: ContactDetail component with management features
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Phone, MessageSquare, Clock, Send, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContactDetail = ({ contact, onClose, onUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(contact?.funnel_stage || 'Novo Lead');
    
    useEffect(() => {
        if (contact?.id) {
            fetchMessages();
            setStatus(contact.funnel_stage);
        }
    }, [contact]);

    const fetchMessages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('message_history')
            .select('*')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: true });
        setMessages(data || []);
        setLoading(false);
    };

    const handleStageChange = async (newStage) => {
        setStatus(newStage);
        await supabase
            .from('contacts')
            .update({ funnel_stage: newStage })
            .eq('id', contact.id);
        
        if (onUpdate) onUpdate();
    };

    const openWhatsApp = () => {
        const num = contact.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${num}`, '_blank');
    };

    const funnelStages = [
        "Novo Lead", "Em Contato", "Agendado", "Venda Realizada", "Perdido"
    ];

    if (!contact) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{contact.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-slate-400">
                            <Phone className="h-4 w-4" />
                            <span className="font-mono">{contact.phone}</span>
                        </div>
                    </div>
                    <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        Fechar
                    </Button>
                </div>

                <div className="flex gap-3">
                    <Select value={status} onValueChange={handleStageChange}>
                        <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-slate-200">
                            <SelectValue placeholder="Estágio" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                            {funnelStages.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <MessageSquare className="h-4 w-4" /> WhatsApp
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Histórico de Mensagens</span>
                    {contact.last_message_date && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 
                            Última: {format(parseISO(contact.last_message_date), "dd/MM/yy HH:mm")}
                        </span>
                    )}
                </div>

                <ScrollArea className="flex-1 p-4 bg-slate-950/30">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-slate-600 p-8">Nenhuma mensagem registrada.</div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, idx) => {
                                const isOut = msg.direction === 'outbound';
                                return (
                                    <div key={idx} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                            isOut ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                        }`}>
                                            <p className="whitespace-pre-wrap">{msg.message_content}</p>
                                            <span className={`text-[10px] block mt-1 ${isOut ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {format(parseISO(msg.created_at || msg.message_date), "dd/MM HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};

export default ContactDetail;