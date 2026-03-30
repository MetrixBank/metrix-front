import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useOpportunityDetails = (opportunityId) => {
    const [opportunity, setOpportunity] = useState(null);
    const [classifications, setClassifications] = useState(null);
    const [events, setEvents] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [stageHistory, setStageHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!opportunityId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Opportunity
                const { data: opp, error: oppError } = await supabase
                    .from('funnel_opportunities')
                    .select('*')
                    .eq('id', opportunityId)
                    .single();
                
                if (oppError) throw oppError;
                setOpportunity(opp);

                // 2. Fetch Classifications
                const { data: classif } = await supabase
                    .from('funnel_classifications')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                setClassifications(classif);

                // 3. Fetch Events (Timeline)
                const { data: evts } = await supabase
                    .from('funnel_events')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('created_at', { ascending: false });
                setEvents(evts || []);

                // 4. Fetch Suggestions
                const { data: sugg } = await supabase
                    .from('response_suggestions')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                // Parse suggestions if stored as JSONB
                let parsedSuggestions = [];
                if (sugg && sugg.suggestions) {
                    if (Array.isArray(sugg.suggestions)) {
                        parsedSuggestions = sugg.suggestions;
                    } else if (sugg.suggestions.items) {
                        parsedSuggestions = sugg.suggestions.items;
                    }
                }
                setSuggestions(parsedSuggestions);

                // 5. Fetch Stage History
                const { data: hist } = await supabase
                    .from('funnel_stage_history')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('changed_at', { ascending: false });
                setStageHistory(hist || []);

            } catch (err) {
                console.error('Error fetching details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Subscriptions for real-time updates
        const sub1 = supabase.channel(`opp_detail_${opportunityId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'funnel_opportunities', filter: `id=eq.${opportunityId}` }, (payload) => setOpportunity(payload.new))
            .subscribe();

        const sub2 = supabase.channel(`events_detail_${opportunityId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events', filter: `opportunity_id=eq.${opportunityId}` }, (payload) => setEvents(prev => [payload.new, ...prev]))
            .subscribe();

        return () => {
            supabase.removeChannel(sub1);
            supabase.removeChannel(sub2);
        };

    }, [opportunityId]);

    return { opportunity, classifications, events, suggestions, stageHistory, loading, error };
};