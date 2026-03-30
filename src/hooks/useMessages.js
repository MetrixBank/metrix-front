import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useMessages = (leadId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!leadId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar mensagens',
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [leadId, toast]);

  const sendMessage = async (text, sender = 'distributor') => {
    if (!leadId || !text) return;

    try {
      const newMessage = {
        lead_id: leadId,
        message: text,
        sender,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('lead_messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      // Optimistically update UI
      setMessages(prev => [...prev, data]);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar mensagem',
        description: err.message
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    sendMessage
  };
};