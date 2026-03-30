import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { subMonths, format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook to fetch all data related to a Sub-Admin's team.
 * Uses 'get_user_descendants_and_self' RPC to identify team members.
 * Returns raw data lists (distributors, opportunities, etc.) and computed analytics.
 * 
 * @param {string} subAdminId - The UUID of the sub-admin user.
 * @returns {Object} { data, loading, error, refetch }
 */
const useSubAdminTeamData = (subAdminId) => {
    const [data, setData] = useState({
        // Raw Data Lists
        distributors: [],
        opportunities: [],
        products: [],
        customers: [],
        
        // Computed Analytics (Backwards compatibility for Overview Tab)
        kpis: {
            totalRevenue: 0,
            activeDistributors: 0,
            totalPoints: 0,
            totalTeamTokens: 0,
            tokenValue: 0
        },
        charts: {
            revenueOverTime: [],
            productionByTeam: [],
            distributorRanking: [],
            activityFunnel: [],
            futureProjection: []
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!subAdminId) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Get Team IDs using RPC
            const { data: teamIdsData, error: teamError } = await supabase
                .rpc('get_user_descendants_and_self', { p_user_id: subAdminId });

            if (teamError) throw teamError;
            
            // Map to array of IDs, ensure unique
            const teamIds = [...new Set(teamIdsData.map(d => d.id))];

            if (teamIds.length === 0) {
                 setData(prev => ({ ...prev, distributors: [], opportunities: [], products: [], customers: [] }));
                 setLoading(false);
                 return;
            }

            // 2. Fetch all raw data in parallel
            const [profilesResp, oppsResp, productsResp, customersResp] = await Promise.all([
                // A. Profiles (Distributors)
                supabase
                    .from('profiles')
                    .select('id, name, email, phone, avatar_url, points, tokens, role, distributor_type, registration_status, created_at, region')
                    .in('id', teamIds),
                
                // B. Opportunities (Activities)
                supabase
                    .from('sales_opportunities')
                    .select(`
                        id, 
                        distributor_id, 
                        customer_name, 
                        customer_phone,
                        activity_type,
                        status, 
                        visit_date, 
                        sale_value, 
                        consultant_name,
                        created_at,
                        notes
                    `)
                    .in('distributor_id', teamIds)
                    .gte('visit_date', subMonths(new Date(), 6).toISOString())
                    .order('visit_date', { ascending: false }),

                // C. Products
                supabase
                    .from('products')
                    .select('*')
                    .in('distributor_id', teamIds),

                // D. Customers
                supabase
                    .from('customers')
                    .select('*')
                    .in('distributor_id', teamIds)
            ]);

            if (profilesResp.error) throw profilesResp.error;
            if (oppsResp.error) throw oppsResp.error;
            if (productsResp.error) throw productsResp.error;
            if (customersResp.error) throw customersResp.error;

            const distributors = profilesResp.data || [];
            const opportunities = oppsResp.data || [];
            const products = productsResp.data || [];
            const customers = customersResp.data || [];

            // 3. Compute Analytics (Client-side aggregation for Dashboard)
            
            // KPIs
            const activeDistributors = new Set(opportunities.map(o => o.distributor_id)).size;
            const totalRevenue = opportunities
                .filter(o => o.status === 'sale_made')
                .reduce((acc, curr) => acc + (Number(curr.sale_value) || 0), 0);
            
            const totalPoints = distributors.reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
            const totalTeamTokens = distributors.reduce((acc, curr) => acc + (Number(curr.tokens) || 0), 0);

            // Chart: Revenue Over Time
            const revenueByMonth = {};
            for (let i = 0; i < 6; i++) {
                const date = subMonths(new Date(), i);
                const key = format(date, 'MMM/yyyy', { locale: ptBR });
                revenueByMonth[key] = { name: key, value: 0, date: date };
            }

            opportunities.forEach(opp => {
                if (opp.status === 'sale_made' && opp.visit_date) {
                    const date = new Date(opp.visit_date);
                    const key = format(date, 'MMM/yyyy', { locale: ptBR });
                    if (revenueByMonth[key]) {
                        revenueByMonth[key].value += Number(opp.sale_value) || 0;
                    }
                }
            });
            const revenueOverTime = Object.values(revenueByMonth).sort((a, b) => a.date - b.date);

            // Chart: Production By Team & Ranking
            const productionMap = {};
            distributors.forEach(p => {
                productionMap[p.id] = { 
                    id: p.id,
                    name: p.name || 'Desconhecido', 
                    value: 0, 
                    avatar: p.avatar_url,
                    points: p.points || 0,
                    role: p.role
                };
            });

            opportunities.forEach(opp => {
                if (opp.status === 'sale_made' && productionMap[opp.distributor_id]) {
                    productionMap[opp.distributor_id].value += Number(opp.sale_value) || 0;
                }
            });

            const productionByTeam = Object.values(productionMap)
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            const distributorRanking = Object.values(productionMap)
                .map(d => ({
                    ...d,
                    revenue: d.value,
                    activities: opportunities.filter(o => o.distributor_id === d.id).length,
                    conversionRate: opportunities.filter(o => o.distributor_id === d.id).length > 0 
                        ? (opportunities.filter(o => o.distributor_id === d.id && o.status === 'sale_made').length / opportunities.filter(o => o.distributor_id === d.id).length) * 100 
                        : 0
                }))
                .sort((a, b) => b.revenue - a.revenue);

            // Chart: Funnel
            const funnelCounts = { 'new': 0, 'contacted': 0, 'scheduled': 0, 'sale_made': 0, 'lost': 0 };
            opportunities.forEach(opp => {
                if (opp.status === 'new' || opp.status === 'prospecting') funnelCounts['new']++;
                else if (opp.status === 'in_progress' || opp.status === 'contacted') funnelCounts['contacted']++;
                else if (opp.status === 'scheduled' || opp.status === 'visit_made') funnelCounts['scheduled']++;
                else if (opp.status === 'sale_made') funnelCounts['sale_made']++;
                else if (opp.status === 'lost' || opp.status === 'completed_no_sale') funnelCounts['lost']++;
            });

            const activityFunnel = [
                { name: 'Prospecção', value: funnelCounts['new'] + funnelCounts['contacted'] + funnelCounts['scheduled'] + funnelCounts['sale_made'] + funnelCounts['lost'], fill: '#3b82f6' },
                { name: 'Agendados', value: funnelCounts['scheduled'] + funnelCounts['sale_made'] + funnelCounts['lost'], fill: '#8b5cf6' },
                { name: 'Realizados', value: funnelCounts['sale_made'] + funnelCounts['lost'], fill: '#f59e0b' },
                { name: 'Vendas', value: funnelCounts['sale_made'], fill: '#10b981' }
            ];

            // Chart: Future Projection
            const lastMonthRev = revenueOverTime[revenueOverTime.length - 1]?.value || 0;
            const growthRate = 1.1; 
            const futureProjection = [
                { name: format(addMonths(new Date(), 1), 'MMM', { locale: ptBR }), actual: 0, projected: lastMonthRev * growthRate },
                { name: format(addMonths(new Date(), 2), 'MMM', { locale: ptBR }), actual: 0, projected: lastMonthRev * Math.pow(growthRate, 2) },
                { name: format(addMonths(new Date(), 3), 'MMM', { locale: ptBR }), actual: 0, projected: lastMonthRev * Math.pow(growthRate, 3) },
            ];

            setData({
                distributors,
                opportunities,
                products,
                customers,
                kpis: {
                    totalRevenue,
                    activeDistributors,
                    totalPoints,
                    totalTeamTokens,
                    tokenValue: totalTeamTokens * 0.10
                },
                charts: {
                    revenueOverTime,
                    productionByTeam,
                    distributorRanking,
                    activityFunnel,
                    futureProjection
                }
            });

        } catch (err) {
            console.error('Error in useSubAdminTeamData:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [subAdminId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

export default useSubAdminTeamData;