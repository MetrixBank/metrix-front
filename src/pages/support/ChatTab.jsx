import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const ChatTab = ({ user }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchConversation = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*, messages:support_messages(*, sender:profiles(id, name, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { foreignTable: 'support_messages', ascending: true })
        .maybeSingle();

      if (error) {
        console.error('Error fetching conversation:', error);
        toast({ title: "Erro", description: "Não foi possível carregar a conversa.", variant: "destructive" });
      } else {
        setConversation(data);
        setMessages(data?.messages || []);
      }
      setLoading(false);
    };

    fetchConversation();
  }, [user.id, toast]);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support-chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const { data: senderProfile, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();
          
          if (error) {
            console.error("Error fetching sender profile for new message:", error);
            setMessages((prev) => [...prev, payload.new]);
          } else {
            setMessages((prev) => [...prev, { ...payload.new, sender: senderProfile }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartConversation = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_conversations')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error starting conversation:', error);
      toast({ title: "Erro", description: "Não foi possível iniciar a conversa.", variant: "destructive" });
    } else {
      setConversation(data);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversation) return;

    setSending(true);
    const messageData = {
      conversation_id: conversation.id,
      sender_id: user.id,
      message: newMessage.trim(),
    };

    const { error } = await supabase.from('support_messages').insert(messageData);

    if (error) {
      console.error('Error sending message:', error);
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const getUserInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">Você ainda não tem uma conversa com o suporte.</p>
        <Button onClick={handleStartConversation}>Iniciar Chat com Suporte</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] border rounded-lg bg-muted/20">
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`flex items-end gap-2 my-2 ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender_id !== user.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender?.avatar_url} />
                  <AvatarFallback>{getUserInitials(msg.sender?.name)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
              {msg.sender_id === user.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={sending || newMessage.trim() === ''}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatTab;