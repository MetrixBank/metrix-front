import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const useTeamGoalsRankings = (goal) => {
    const { user } = useAuth();
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [teamProgress, setTeamProgress] = useState(0);

    const fetchRankings = useCallback(async () => {
        if (!goal || !goal.id) return;

        try {
            setLoading(true);
            
            // Fetch participants and their progress
            // We join goal_participants to ensure we get everyone assigned, even if they have 0 progress
            const { data: participantsData, error: participantsError } = await supabase
                .from('goal_participants')
                .select(`
                    user_id,
                    profiles:user_id (name, avatar_url)
                `)
                .eq('goal_id', goal.id);

            if (participantsError) throw participantsError;

            // Fetch progress for this goal
            const { data: progressData, error: progressError } = await supabase
                .from('goal_progress')
                .select('*')
                .eq('goal_id', goal.id);

            if (progressError) throw progressError;

            const metricType = goal.ranking_type || 'points'; 
            
            const processedRankings = (participantsData || []).map(p => {
                const progressRecord = progressData?.find(prog => prog.user_id === p.user_id);
                let value = 0;
                
                if (progressRecord) {
                    if (metricType === 'revenue') value = Number(progressRecord.revenue_value || 0);
                    else if (metricType === 'tokens') value = Number(progressRecord.tokens_value || 0);
                    else value = Number(progressRecord.points_value || progressRecord.current_value || 0);
                }

                // Calculate percentage
                const target = Number(goal.target_value_primary) || 1;
                const percentage = Math.min(100, Math.max(0, (value / target) * 100));

                return {
                    distributor_id: p.user_id,
                    name: p.profiles?.name || 'Usuário',
                    avatar_url: p.profiles?.avatar_url,
                    value: value,
                    percentage: percentage,
                    formattedValue: metricType === 'revenue' 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                        : value.toFixed(0)
                };
            });

            // Sort descending by value
            processedRankings.sort((a, b) => b.value - a.value);

            // Assign rank position
            const rankedList = processedRankings.map((item, index) => ({
                ...item,
                rank: index + 1,
                isCurrentUser: user ? item.distributor_id === user.id : false
            }));

            setRankings(rankedList);

            // Calculate total team progress
            const totalProgress = rankedList.reduce((acc, curr) => acc + curr.value, 0);
            setTeamProgress(totalProgress);

            // Find current user's rank
            if (user) {
                const myRank = rankedList.find(r => r.distributor_id === user.id);
                setCurrentUserRank(myRank || null);
            }

        } catch (err) {
            console.error("Error in useTeamGoalsRankings:", err);
        } finally {
            setLoading(false);
        }
    }, [goal, user]);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    // Real-time subscription
    useEffect(() => {
        if (!goal || !goal.id) return;

        const channel = supabase
            .channel(`goal-progress-${goal.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'goal_progress',
                    filter: `goal_id=eq.${goal.id}`
                },
                () => {
                    fetchRankings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [goal?.id, fetchRankings]);

    return { 
        rankings, 
        loading, 
        currentUserRank, 
        teamProgress,
        metricLabel: goal?.ranking_type === 'revenue' ? '' : goal?.ranking_type === 'tokens' ? 'tokens' : 'pts'
    };
};

export default useTeamGoalsRankings;