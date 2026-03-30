import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Send, User, Clock, CheckCircle, Archive, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AdminSupportTab = () => {
  const { user: adminUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*, user:profiles(id, name, avatar_url)')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as conversas.", variant: "destructive" });
    } else {
      setConversations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('support-conversations-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, fetchConversations)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          fetchMessages(selectedConversation.id);
        } else {
          fetchConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (conversationId) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*, sender:profiles(id, name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as mensagens.", variant: "destructive" });
    } else {
      setMessages(data);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation) return;

    setSending(true);
    const messageData = {
      conversation_id: selectedConversation.id,
      sender_id: adminUser.id,
      message: newMessage.trim(),
    };

    const { error } = await supabase.from('support_messages').insert(messageData);

    if (error) {
      console.error('Error sending message:', error);
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
    } else {
      setNewMessage('');
      setMessages(prev => [...prev, { ...messageData, created_at: new Date().toISOString(), sender: { id: adminUser.id, name: adminUser.name, avatar_url: adminUser.avatar_url } }]);
    }
    setSending(false);
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from('support_conversations')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', selectedConversation.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível arquivar a conversa.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Conversa arquivada." });
      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    }
  };

  const getUserInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-1/3 border-r pr-6">
        <h2 className="text-2xl font-bold mb-4">Conversas de Suporte</h2>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto h-full">
            {conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => handleSelectConversation(convo)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedConversation?.id === convo.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={convo.user?.avatar_url} />
                  <AvatarFallback>{getUserInitials(convo.user?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{convo.user?.name || 'Usuário desconhecido'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {convo.status === 'open' ? <Clock className="w-3 h-3 text-yellow-500" /> : <CheckCircle className="w-3 h-3 text-green-500" />}
                    {convo.status === 'open' ? 'Aberta' : 'Fechada'} - {formatDistanceToNow(new Date(convo.updated_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <div className="flex flex-col h-full border rounded-lg bg-muted/20">
            <div className="p-4 border-b flex justify-between items-center bg-background rounded-t-lg">
              <h3 className="font-bold text-lg">{selectedConversation.user?.name}</h3>
              {selectedConversation.status === 'open' && (
                <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                  <Archive className="w-4 h-4 mr-2" /> Arquivar Conversa
                </Button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className={`flex items-end gap-2 my-2 ${msg.sender_id === adminUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender_id !== adminUser.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.sender?.avatar_url} />
                        <AvatarFallback>{getUserInitials(msg.sender?.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender_id === adminUser.id ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === adminUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                    {msg.sender_id === adminUser.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={adminUser.avatar_url} />
                        <AvatarFallback>{getUserInitials(adminUser.name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            {selectedConversation.status === 'open' && (
              <div className="p-4 border-t bg-background rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua resposta..."
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
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border rounded-lg bg-muted/20">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p>Selecione uma conversa para visualizar as mensagens.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportTab;