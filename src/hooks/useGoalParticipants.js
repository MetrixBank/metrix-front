import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useGoalParticipants = (goalId) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchParticipants = useCallback(async () => {
        if (!goalId) return;

        try {
            setLoading(true);
            setError(null);
            
            // Fetch participants
            const { data: participantsData, error: pError } = await supabase
                .from('goal_participants')
                .select(`
                    user_id,
                    profiles:user_id (name, avatar_url)
                `)
                .eq('goal_id', goalId);
                
            if (pError) throw pError;

            // Fetch progress
            const { data: progressData, error: progError } = await supabase
                .from('goal_progress')
                .select('*')
                .eq('goal_id', goalId);

            if (progError) throw progError;

            // Fetch Goal info to know ranking type
            const { data: goalData, error: goalError } = await supabase
                 .from('goals')
                 .select('ranking_type')
                 .eq('id', goalId)
                 .single();
                 
            if (goalError) throw goalError;
            
            const metricType = goalData.ranking_type || 'points';

            // Merge data
            const merged = participantsData.map(p => {
                const progress = progressData.find(prog => prog.user_id === p.user_id);
                let value = 0;
                
                if (progress) {
                    if (metricType === 'revenue') value = Number(progress.revenue_value || 0);
                    else if (metricType === 'tokens') value = Number(progress.tokens_value || 0);
                    else value = Number(progress.points_value || 0);
                }
                
                return {
                    user_id: p.user_id,
                    name: p.profiles?.name || 'Usuário',
                    avatar_url: p.profiles?.avatar_url,
                    value: value,
                    rankingType: metricType
                };
            });
            
            setParticipants(merged);

        } catch (err) {
            console.error('Error fetching goal participants:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [goalId]);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    return { participants, loading, error, refetch: fetchParticipants };
};

export default useGoalParticipants;