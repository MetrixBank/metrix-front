import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const useTeamGoals = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasManager, setHasManager] = useState(false);

    const fetchTeamGoals = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            
            // 1. Check for manager (parent_id)
            // We need to fetch the current user's profile to see if they have a parent_id (manager)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('parent_id')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error("Error fetching user profile for team goals:", profileError);
                // Don't throw here, just assume no manager to prevent crashing
                setHasManager(false);
                setGoals([]);
                setLoading(false);
                return;
            }

            if (!profile?.parent_id) {
                setHasManager(false);
                setGoals([]);
                setLoading(false);
                return;
            }

            setHasManager(true);
            const managerId = profile.parent_id;

            // 2. Fetch active team goals created by manager
            // We select goals where created_by is the manager AND distributor_type is 'team'
            const { data: goalsData, error: goalsError } = await supabase
                .from('goals')
                .select('*')
                .eq('created_by', managerId)
                .eq('distributor_type', 'team')
                .eq('is_active', true) // Ideally we want active goals
                .order('created_at', { ascending: false });

            if (goalsError) throw goalsError;

            if (!goalsData || goalsData.length === 0) {
                setGoals([]);
                setLoading(false);
                return;
            }

            setGoals(goalsData);

        } catch (err) {
            console.error('Error in useTeamGoals:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTeamGoals();

        // Subscriptions
        const goalsSub = supabase
            .channel('public:goals_team_view')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
                fetchTeamGoals();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(goalsSub);
        };
    }, [user, fetchTeamGoals]);

    return {
        goals,
        loading,
        error,
        hasManager,
        refetch: fetchTeamGoals
    };
};

export default useTeamGoals;