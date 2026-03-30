import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useFunnelOpportunities = ({ page = 1, pageSize = 20, filters = {} } = {}) => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchOpportunities = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('funnel_opportunities')
                .select(`
                    *,
                    funnel_classifications (
                        temperature_score, probability_score, priority_level, risk_level
                    )
                `, { count: 'exact' })
                .eq('distributor_id', user.id)
                .eq('is_active', true)
                .not('source_webhook_id', 'is', null);

            // Apply Filters
            if (filters.search) {
                query = query.ilike('customer_name', `%${filters.search}%`);
            }
            if (filters.stage && filters.stage !== 'all') {
                query = query.eq('stage', filters.stage);
            }
            if (filters.temperature && filters.temperature !== 'all') {
                query = query.eq('temperature', filters.temperature);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            
            // Sorting
            if (filters.sortBy) {
                const { field, direction } = filters.sortBy;
                query = query.order(field, { ascending: direction === 'asc' });
            } else {
                query = query.order('updated_at', { ascending: false });
            }

            const { data, error: fetchError, count } = await query.range(from, to);

            if (fetchError) throw fetchError;

            setOpportunities(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Error fetching opportunities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, page, pageSize, JSON.stringify(filters)]);

    // Initial Fetch
    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    // Real-time Subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('funnel_opportunities_changes_prod')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'funnel_opportunities', filter: `distributor_id=eq.${user.id}` }, 
                () => {
                    fetchOpportunities(); 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchOpportunities]);

    return { 
        opportunities, 
        loading, 
        error, 
        totalCount, 
        refetch: fetchOpportunities 
    };
};