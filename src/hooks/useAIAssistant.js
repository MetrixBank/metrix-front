import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useAIAssistant = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [currentLeadId, setCurrentLeadId] = useState(null);
    const [error, setError] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);

    const analyzeLead = useCallback(async (lead, table = 'leads') => {
        setAnalyzing(true);
        setError(null);
        setCurrentLeadId(lead.id);
        setPanelOpen(true);

        // Check if we already have a recent analysis cached in the DB
        if (lead.ai_analysis_json && lead.ai_last_analyzed_at) {
             const lastAnalyzed = new Date(lead.ai_last_analyzed_at);
             const now = new Date();
             const hoursDiff = Math.abs(now - lastAnalyzed) / 36e5;
             
             // Use cache if less than 24 hours old
             if (hoursDiff < 24) {
                 setAnalysisResult(lead.ai_analysis_json);
                 setAnalyzing(false);
                 return;
             }
        }

        try {
            const { data, error } = await supabase.functions.invoke('api-ai-assistant', {
                body: {
                    name: lead.name,
                    phone: lead.phone,
                    message: lead.message || lead.details?.message,
                    product_interest: lead.interests || lead.product_name,
                    origin: lead.source,
                    last_interaction_date: lead.last_activity_at
                }
            });

            if (error) throw error;

            setAnalysisResult(data);

            // Persist analysis to DB
            await supabase
                .from(table)
                .update({
                    ai_analysis_json: data,
                    ai_last_analyzed_at: new Date().toISOString(),
                    ai_classification: data.lead_classification,
                    ai_priority: data.priority,
                    ai_suggested_tags: data.suggested_tags
                })
                .eq('id', lead.id);

        } catch (err) {
            console.error('AI Analysis failed:', err);
            setError(err.message || 'Falha ao analisar lead com IA');
            toast({ 
                title: 'Erro na Análise IA', 
                description: 'Não foi possível completar a análise. Tente novamente.', 
                variant: 'destructive' 
            });
        } finally {
            setAnalyzing(false);
        }
    }, []);

    const acceptSuggestion = useCallback(async (leadId, type, data, table = 'leads') => {
        try {
            let updates = {};
            if (type === 'tags') {
                updates = { interests: data.join(', ') }; // Simplified mapping
            } else if (type === 'stage') {
                updates = { status: data }; // Assuming status maps to stage
            }

            const { error } = await supabase
                .from(table)
                .update(updates)
                .eq('id', leadId);

            if (error) throw error;

            toast({
                title: 'Sugestão Aplicada',
                description: 'O lead foi atualizado com sucesso.',
                variant: 'default',
                className: 'bg-green-600 text-white'
            });
            return true;
        } catch (err) {
            console.error('Error accepting suggestion:', err);
            toast({
                title: 'Erro',
                description: 'Não foi possível aplicar a sugestão.',
                variant: 'destructive'
            });
            return false;
        }
    }, []);

    const copyMessage = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Mensagem copiada!', description: 'Pronto para colar no WhatsApp.' });
    };

    const closePanel = () => {
        setPanelOpen(false);
        setAnalysisResult(null);
    };

    return {
        analyzing,
        analysisResult,
        error,
        analyzeLead,
        acceptSuggestion,
        copyMessage,
        panelOpen,
        closePanel,
        currentLeadId
    };
};