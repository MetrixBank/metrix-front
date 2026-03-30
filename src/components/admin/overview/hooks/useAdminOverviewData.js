import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const useAdminOverviewData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                { data: opportunitiesData, error: opportunitiesError },
                { data: paymentsData, error: paymentsError },
                { data: distributorsData, error: distributorsError },
                { data: productsData, error: productsError },
                { data: customersData, error: customersError }
            ] = await Promise.all([
                supabase
                    .from('sales_opportunities')
                    .select('*, distributor:profiles!inner(id, name, email, region), opportunity_products:opportunity_products!left(*, product:products(id, name, sale_price, cost_price))')
                    .order('created_at', { ascending: false })
                    .limit(200), // Added explicit limit to prevent performance issues with recursive RLS
                supabase
                    .from('payments')
                    .select('*, profiles(name, email)')
                    .order('created_at', { ascending: false })
                    .limit(100),
                // Modified to fetch sub-admins as well, as they are also distributors in the hierarchy context
                supabase.from('profiles').select('*').in('role', ['distributor', 'sub-admin']), 
                supabase.from('products').select('*'),
                supabase
                    .from('customers')
                    .select('*, distributor:profiles(id, name, email)')
                    .limit(500)
            ]);

            if (opportunitiesError) throw opportunitiesError;
            if (paymentsError) throw paymentsError;
            if (distributorsError) throw distributorsError;
            if (productsError) throw productsError;
            if (customersError) throw customersError;

            // Build distributor hierarchy for filtering
            const distributorHierarchy = {};
            distributorsData.forEach(d => {
                if (d.parent_id) {
                    if (!distributorHierarchy[d.parent_id]) {
                        distributorHierarchy[d.parent_id] = [];
                    }
                    distributorHierarchy[d.parent_id].push(d.id);
                }
            });

            setData({
                opportunities: opportunitiesData || [],
                payments: paymentsData || [],
                distributors: distributorsData || [],
                products: productsData || [],
                customers: customersData || [],
                distributorHierarchy
            });
        } catch (err) {
            console.error("Error fetching admin overview data:", err);
            setError(err);
            toast({
                title: 'Erro ao Carregar Dados',
                description: 'Não foi possível buscar os dados do painel. Verifique sua conexão e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData, allDistributorsForFilter: data?.distributors };
};

export default useAdminOverviewData;