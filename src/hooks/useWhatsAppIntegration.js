import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useWhatsAppIntegration = () => {
  const { toast } = useToast();

  const formatMessageForWhatsApp = useCallback((text) => {
    if (!text) return '';
    return encodeURIComponent(text);
  }, []);

  const generateWhatsAppLink = useCallback((phone, message) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = formatMessageForWhatsApp(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }, [formatMessageForWhatsApp]);

  const trackMessageSent = useCallback(async (leadId, message, sender = 'distributor') => {
    if (!leadId || !message) return false;

    try {
      const { error } = await supabase
        .from('lead_messages')
        .insert([{
          lead_id: leadId,
          message: message,
          sender: sender,
          timestamp: new Date().toISOString(),
          read: true,
          event_type: 'message'
        }]);

      if (error) throw error;
      
      // Update last activity on lead
      await supabase
        .from('leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);

      return true;
    } catch (err) {
      console.error('Error tracking message:', err);
      toast({
        variant: "destructive",
        title: "Erro ao registrar",
        description: "A mensagem foi enviada, mas não salva no histórico.",
      });
      return false;
    }
  }, [toast]);

  const openWhatsAppAndTrack = useCallback(async (leadId, phone, message) => {
    const link = generateWhatsAppLink(phone, message);
    if (!link) {
      toast({ variant: "destructive", title: "Erro", description: "Telefone inválido." });
      return;
    }

    window.open(link, '_blank');
    await trackMessageSent(leadId, message);
  }, [generateWhatsAppLink, trackMessageSent, toast]);

  return {
    formatMessageForWhatsApp,
    generateWhatsAppLink,
    trackMessageSent,
    openWhatsAppAndTrack
  };
};

export default useWhatsAppIntegration;