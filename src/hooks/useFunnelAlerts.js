import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useFunnelAlerts = () => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const generateAlerts = async () => {
            setLoading(true);
            try {
                // Fetch only real active opportunities
                const { data: opportunities, error } = await supabase
                    .from('funnel_opportunities')
                    .select('*')
                    .eq('distributor_id', user.id)
                    .eq('is_active', true)
                    .not('source_webhook_id', 'is', null);

                if (error) throw error;

                const newAlerts = [];
                const now = new Date();

                if (opportunities && opportunities.length > 0) {
                    opportunities.forEach(opp => {
                        const lastContact = new Date(opp.last_contact_date || opp.created_at);
                        const daysIdle = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

                        // 1. Alert: Responder Agora (Idle > 24h & stage not closed)
                        if (daysIdle >= 1 && !['closed_won', 'closed_lost'].includes(opp.stage)) {
                            newAlerts.push({
                                id: `urgent_${opp.id}`,
                                opportunity_id: opp.id,
                                type: 'urgent',
                                title: 'Responder Agora',
                                message: `Sem interação há ${daysIdle} dia(s)`,
                                opportunity_name: opp.customer_name,
                                priority: 'high'
                            });
                        }

                        // 2. Alert: Lead Esfriando (Idle > 7 days)
                        if (daysIdle > 7 && daysIdle < 14) {
                            newAlerts.push({
                                id: `cooling_${opp.id}`,
                                opportunity_id: opp.id,
                                type: 'cooling',
                                title: 'Lead Esfriando',
                                message: 'Cliente perdendo engajamento',
                                opportunity_name: opp.customer_name,
                                priority: 'medium'
                            });
                        }

                        // 3. Alert: Momento de Fechar (High prob > 80%)
                        if (opp.probability > 80 && opp.stage !== 'closed_won' && opp.stage !== 'closed_lost') {
                            newAlerts.push({
                                id: `closing_${opp.id}`,
                                opportunity_id: opp.id,
                                type: 'closing',
                                title: 'Momento de Fechar',
                                message: 'Alta probabilidade de conversão',
                                opportunity_name: opp.customer_name,
                                priority: 'high'
                            });
                        }

                        // 4. Alert: Risco de Perda (Negotiation > 21 days)
                        // Assuming created_at is start of cycle, or we track stage change time.
                        // Using created_at as proxy for now if stage_changed_at isn't available on main obj
                        const daysOpen = Math.floor((now - new Date(opp.created_at)) / (1000 * 60 * 60 * 24));
                        if (opp.stage === 'negotiation' && daysOpen > 21) {
                            newAlerts.push({
                                id: `risk_${opp.id}`,
                                opportunity_id: opp.id,
                                type: 'risk',
                                title: 'Risco de Perda',
                                message: 'Negociação estagnada há muito tempo',
                                opportunity_name: opp.customer_name,
                                priority: 'high'
                            });
                        }
                    });
                }

                // Sort by priority (high first)
                newAlerts.sort((a, b) => (a.priority === 'high' ? -1 : 1));
                setAlerts(newAlerts);

            } catch (err) {
                console.error("Error generating alerts:", err);
            } finally {
                setLoading(false);
            }
        };

        generateAlerts();

        const channel = supabase
            .channel('alerts_opp_changes_prod')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'funnel_opportunities', filter: `distributor_id=eq.${user.id}` }, () => {
                generateAlerts();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);

    }, [user]);

    return { alerts, loading };
};