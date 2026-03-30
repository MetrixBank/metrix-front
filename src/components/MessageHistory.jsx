import React, { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const MessageHistory = ({ messages, loading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn(
            "flex max-w-[80%]",
            i % 2 === 0 ? "ml-auto justify-end" : "mr-auto justify-start"
          )}>
            <Skeleton className="h-12 w-48 rounded-2xl bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <p>Nenhuma mensagem no histórico.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent bg-slate-950">
      {messages.map((msg, idx) => {
        const isOutbound = msg.direction === 'outbound';
        const date = msg.message_date ? parseISO(msg.message_date) : new Date();
        
        return (
          <div 
            key={msg.id || idx} 
            className={cn(
              "flex flex-col max-w-[85%]",
              isOutbound ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "px-4 py-2 rounded-2xl shadow-sm text-sm break-words",
              isOutbound 
                ? "bg-blue-600 text-white rounded-tr-sm" 
                : "bg-slate-800 text-slate-200 rounded-tl-sm"
            )}>
              {msg.message_content}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {format(date, "HH:mm", { locale: ptBR })}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageHistory;