import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageSquare, Copy, Send, RefreshCw } from 'lucide-react';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const SalesAISuggestions = ({ lead }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const { openWhatsAppAndTrack } = useWhatsAppIntegration();

  const fetchAnalysis = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      // Fetch recent messages context for AI
      const { data: messages } = await supabase
        .from('lead_messages')
        .select('sender, message')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationHistory = messages ? messages.reverse() : [];

      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: { 
          lead_id: lead.id, 
          lead_name: lead.name,
          conversation_history: conversationHistory 
        }
      });

      if (error) throw error;
      setAnalysis(data);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      // Fallback/Mock for demo if edge function fails or not deployed
      setAnalysis({
        recommended_action: "Agendar uma demonstração rápida.",
        suggested_messages: [
           { text: `Olá ${lead.name}, tudo bem? Gostaria de agendar uma breve conversa para entender melhor sua necessidade?` },
           { text: "Vi que você tem interesse. Posso te enviar nosso catálogo atualizado?" },
           { text: "Oi! Tem alguma dúvida específica que eu possa ajudar agora?" }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lead?.id) fetchAnalysis();
  }, [lead?.id]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  if (!lead) return null;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 py-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Sugestões da IA
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchAnalysis} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : analysis ? (
          <>
            {analysis.recommended_action && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Próximo Passo Recomendado:</p>
                <p className="text-sm text-purple-900 dark:text-purple-100">{analysis.recommended_action}</p>
              </div>
            )}
            
            <div className="space-y-3">
              {analysis.suggested_messages?.map((msg, idx) => (
                <div key={idx} className="bg-card border rounded-lg p-3 text-sm shadow-sm">
                  <p className="mb-2 text-muted-foreground">{msg.text}</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(msg.text)}>
                      <Copy className="h-3 w-3 mr-1" /> Copiar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openWhatsAppAndTrack(lead.id, lead.phone, msg.text)}>
                      <Send className="h-3 w-3 mr-1" /> Zap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma sugestão disponível no momento.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesAISuggestions;