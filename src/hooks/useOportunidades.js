import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useOportunidades = () => {
    const { user } = useAuth();
    const [oportunidades, setOportunidades] = useState({});
    const [rawList, setRawList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOpps = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('oportunidades_funil')
                .select(`
                    *,
                    leads (
                        nome,
                        telefone,
                        email
                    )
                `)
                .eq('distributor_id', user.id);

            if (error) throw error;

            setRawList(data || []);

            // Group by etapa
            const grouped = (data || []).reduce((acc, opp) => {
                const stage = opp.etapa || 'novo_lead';
                if (!acc[stage]) acc[stage] = [];
                acc[stage].push(opp);
                return acc;
            }, {});

            setOportunidades(grouped);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpps();

        const channel = supabase
            .channel('oportunidades_realtime')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'oportunidades_funil', filter: `distributor_id=eq.${user.id}` }, 
                () => {
                    fetchOpps(); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { oportunidades, rawList, loading, error, refetch: fetchOpps };
};