import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const MessageSuggestionsPanel = ({ messages, stageId, onSelectMessage }) => {
  const stageMessages = messages.filter(m => m.stage_id === stageId);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Mensagem copiada para a área de transferência" });
  };

  if (stageMessages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma mensagem sugerida para esta etapa.</p>
        <p className="text-xs mt-1">Configure mensagens modelos na aba de Configurações.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-3">
        {stageMessages.map((msg) => (
          <div key={msg.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs font-normal">{msg.title || msg.type || 'Modelo'}</Badge>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(msg.message)} title="Copiar"><Copy className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelectMessage(msg.message)} title="Usar"><Send className="h-3 w-3" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default MessageSuggestionsPanel;