import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useSugestoesResposta = (oportunidadeId) => {
    const [sugestao, setSugestao] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!oportunidadeId) {
            setSugestao(null);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('sugestoes_resposta')
                    .select('*')
                    .eq('oportunidade_id', oportunidadeId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;
                setSugestao(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();

        const channel = supabase
            .channel(`suggestions_${oportunidadeId}`)
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'sugestoes_resposta', filter: `oportunidade_id=eq.${oportunidadeId}` }, 
                (payload) => {
                    setSugestao(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [oportunidadeId]);

    return { sugestao, loading, error };
};