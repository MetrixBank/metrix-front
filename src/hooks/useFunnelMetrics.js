import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useFunnelMetrics = (dateRange = '30d') => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchMetrics = async () => {
            setLoading(true);
            try {
                // Calculate date range
                const endDate = new Date();
                const startDate = new Date();
                if (dateRange === '7d') startDate.setDate(endDate.getDate() - 7);
                else if (dateRange === '30d') startDate.setDate(endDate.getDate() - 30);
                else if (dateRange === '90d') startDate.setDate(endDate.getDate() - 90);

                // Fetch raw opportunities for client-side aggregation
                // Ensuring we only fetch real data from webhooks
                const { data: opps, error: fetchError } = await supabase
                    .from('funnel_opportunities')
                    .select('stage, value, created_at, updated_at, temperature, status, days_without_response')
                    .eq('distributor_id', user.id)
                    .not('source_webhook_id', 'is', null)
                    .gte('created_at', startDate.toISOString());

                if (fetchError) throw fetchError;

                if (!opps || opps.length === 0) {
                    setMetrics({
                        total_opportunities: 0,
                        stage_distribution: {},
                        potential_value: 0,
                        conversion_rate: 0,
                        avg_time_in_stage: 0
                    });
                    return;
                }

                // Calculate Metrics
                const totalOpportunities = opps.length;
                const stageCounts = opps.reduce((acc, curr) => {
                    acc[curr.stage] = (acc[curr.stage] || 0) + 1;
                    return acc;
                }, {});

                const totalValue = opps.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0);
                
                const closedWonCount = stageCounts['closed_won'] || 0;
                const conversionRate = totalOpportunities > 0 ? (closedWonCount / totalOpportunities) * 100 : 0;

                // Simple average days active for open opportunities
                const now = new Date();
                let totalDays = 0;
                let activeCount = 0;
                
                opps.forEach(opp => {
                    const created = new Date(opp.created_at);
                    const days = (now - created) / (1000 * 60 * 60 * 24);
                    totalDays += days;
                    activeCount++;
                });
                
                const avgTime = activeCount > 0 ? Math.round(totalDays / activeCount) : 0;

                setMetrics({
                    total_opportunities: totalOpportunities,
                    stage_distribution: stageCounts,
                    potential_value: totalValue,
                    conversion_rate: conversionRate.toFixed(1),
                    avg_time_in_stage: avgTime
                });

            } catch (err) {
                console.error('Error fetching metrics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();

        // Realtime Subscription
        const channel = supabase
            .channel('metrics_updates_prod')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'funnel_opportunities', filter: `distributor_id=eq.${user.id}` }, () => {
                fetchMetrics(); 
            })
            .subscribe();

        return () => supabase.removeChannel(channel);

    }, [user, dateRange]);

    return { metrics, loading, error };
};