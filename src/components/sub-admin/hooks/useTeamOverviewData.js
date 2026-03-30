import { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { useDataSync } from '@/contexts/DataSyncContext';

    const useTeamOverviewData = (subAdminId) => {
        const [data, setData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const { syncKey } = useDataSync();

        const fetchData = useCallback(async (isInitialLoad = true) => {
            if (!subAdminId) {
                if (isInitialLoad) setLoading(false);
                return;
            }
            if (isInitialLoad) setLoading(true);
            setError(null);
            try {
                const { data: teamMembers, error: teamError } = await supabase.rpc('get_user_descendants_and_self', {
                    p_user_id: subAdminId
                });

                if (teamError) throw teamError;
                
                const teamIds = teamMembers.map(d => d.id);
                
                if (teamIds.length === 0) {
                    teamIds.push(subAdminId);
                }

                const { data: teamProfiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name, email, avatar_url, distributor_type, parent_id, points, tokens, created_at, role')
                    .in('id', teamIds);
                if (profilesError) throw profilesError;

                const [
                    { data: opportunitiesData, error: opportunitiesError },
                    { data: paymentsData, error: paymentsError },
                    { data: productsData, error: productsError },
                    { data: customersData, error: customersError }
                ] = await Promise.all([
                    supabase.from('sales_opportunities').select('*, distributor:profiles!distributor_id(id, name, email, distributor_type), opportunity_products:opportunity_products!left(*, product:products(id, name, sale_price, cost_price))').in('distributor_id', teamIds),
                    supabase.from('payments').select('*, profiles(name, email)').in('user_id', teamIds),
                    supabase.from('products').select('*').in('distributor_id', teamIds).order('created_at', { ascending: false }),
                    supabase.from('customers').select('*, distributor:profiles!distributor_id(id, name, email, distributor_type)').in('distributor_id', teamIds)
                ]);

                if (opportunitiesError) throw opportunitiesError;
                if (paymentsError) throw paymentsError;
                if (productsError) throw productsError;
                if (customersError) throw customersError;
                
                setData({
                    opportunities: opportunitiesData || [],
                    payments: paymentsData || [],
                    distributors: teamProfiles || [],
                    products: productsData || [],
                    customers: customersData || []
                });
            } catch (err) {
                console.error("Error fetching team overview data:", err);
                setError(err);
                if (isInitialLoad) {
                    toast({
                        title: 'Erro ao Carregar Dados da Equipe',
                        description: 'Não foi possível buscar os dados do painel. Verifique sua conexão e tente novamente.',
                        variant: 'destructive',
                    });
                }
            } finally {
                if (isInitialLoad) setLoading(false);
            }
        }, [subAdminId]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        useEffect(() => {
            if(data !== null) { // only refetch if initial data is loaded
                 fetchData(false);
            }
        }, [syncKey]);

        return { data, loading, error, refetch: () => fetchData(true) };
    };

    export default useTeamOverviewData;