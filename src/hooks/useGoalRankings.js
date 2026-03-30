import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useGoalRankings = (goalId) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRankings = useCallback(async () => {
    if (!goalId) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      setError(null);
      // console.log(`Fetching rankings for goal: ${goalId}`);

      const { data, error } = await supabase
        .from('rankings')
        .select(`
          *,
          profiles:user_id (
            name,
            avatar_url,
            distributor_type
          )
        `)
        .eq('goal_id', goalId)
        .order('position', { ascending: true });

      if (error) throw error;
      setRankings(data || []);
      // console.log(`Rankings loaded: ${data?.length}`);

    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  useEffect(() => {
    if (!goalId) return;

    const channel = supabase
      .channel(`rankings_detail_${goalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rankings', filter: `goal_id=eq.${goalId}` },
        () => fetchRankings()
      )
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    };
  }, [goalId, fetchRankings]);

  return { rankings, loading, error, refetch: fetchRankings };
};

export default useGoalRankings;