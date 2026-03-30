import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const useTeamGoalsData = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [goalProgress, setGoalProgress] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Goals created by current user
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      
      const safeGoals = goalsData || [];
      setGoals(safeGoals);

      if (safeGoals.length > 0) {
        const goalIds = safeGoals.map(g => g.id);

        // 2. Fetch Progress for these goals (all value columns)
        const { data: progressData, error: progressError } = await supabase
          .from('goal_progress')
          .select('*')
          .in('goal_id', goalIds);
          
        if (progressError) {
            console.error('Error fetching progress:', progressError);
        } else {
            setGoalProgress(progressData || []);
        }

        // 3. Fetch Rankings for these goals
        // Note: Rankings table might be deprecated in favor of on-the-fly calc from progress
        // But we keep fetching it if the system still populates it.
        const { data: rankingsData, error: rankingsError } = await supabase
          .from('rankings')
          .select(`
            *,
            profiles:user_id (name, avatar_url)
          `)
          .in('goal_id', goalIds);

        if (rankingsError) {
             console.error('Error fetching rankings:', rankingsError);
        } else {
             setRankings(rankingsData || []);
        }
      } else {
          setGoalProgress([]);
          setRankings([]);
      }

    } catch (err) {
      console.error("Error in useTeamGoalsData:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('team_goals_realtime_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `created_by=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goal_progress' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  return { goals, goalProgress, rankings, loading, error, refetch: fetchData };
};

export default useTeamGoalsData;