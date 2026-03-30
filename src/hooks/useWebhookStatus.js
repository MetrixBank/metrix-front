import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useWebhookStatus = () => {
    const { user } = useAuth();
    const [hasRealData, setHasRealData] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        const checkStatus = async () => {
            setLoading(true);
            try {
                // Check if any real webhook data exists in opportunities
                const { count, error: countError } = await supabase
                    .from('funnel_opportunities')
                    .select('*', { count: 'exact', head: true })
                    .eq('distributor_id', user.id)
                    .not('source_webhook_id', 'is', null);
                
                if (countError) throw countError;

                const hasData = count > 0;
                setHasRealData(hasData);

                // Update profile cache if needed (optional optimization)
                if (hasData) {
                    await supabase.from('profiles')
                        .update({ has_real_webhook_data: true })
                        .eq('id', user.id)
                        .eq('has_real_webhook_data', false); // Only update if false
                }

            } catch (err) {
                console.error("Error checking webhook status:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [user]);

    return { hasRealData, loading, error };
};