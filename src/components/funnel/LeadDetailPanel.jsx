import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Send, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useMessages } from '@/hooks/useMessages';

const LeadDetailPanel = ({ lead, onClose }) => {
  const { messages, loading, sendMessage } = useMessages(lead?.id);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    await sendMessage(inputText);
    setInputText('');
  };

  const handleWhatsAppClick = () => {
    if (!lead?.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}`;
    window.open(url, '_blank');
  };

  if (!lead) return null;

  return (
    <div className="h-full flex flex-col bg-background border-l shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border bg-primary/10 text-primary font-bold">
            <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-sm text-foreground">{lead.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> {lead.phone}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} title="Fechar">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900/50">
        <ScrollArea className="h-full p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 mt-10">
              <MessageSquare className="h-12 w-12 mb-2" />
              <p className="text-sm">Nenhuma mensagem ainda.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg) => {
                const isMe = msg.sender === 'distributor';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 text-foreground border rounded-bl-none'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className={`text-[10px] block mt-1 text-right opacity-70`}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer / Input */}
      <div className="p-3 bg-background border-t">
         {/* Action Buttons */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" className="text-xs h-8 whitespace-nowrap text-green-600 border-green-200 hover:bg-green-50" onClick={handleWhatsAppClick}>
                <Phone className="h-3 w-3 mr-1" /> WhatsApp
            </Button>
            {lead.email && (
                 <Button variant="outline" size="sm" className="text-xs h-8 whitespace-nowrap" onClick={() => window.open(`mailto:${lead.email}`)}>
                    <Mail className="h-3 w-3 mr-1" /> Email
                </Button>
            )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LeadDetailPanel;