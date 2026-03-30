import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const useAdminJourneyData = (distributorType = 'all') => {
    const [data, setData] = useState({
        currentMonthRevenue: 0,
        lastMonthRevenue: 0,
        annualJourneyTotal: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const p_type = distributorType === 'all' ? null : distributorType;
            
            const { data: kpiData, error: kpiError } = await supabase.rpc('get_journey_kpi_data', {
                p_distributor_type: p_type
            });

            if (kpiError) throw kpiError;

            setData({
                currentMonthRevenue: kpiData.currentmonthrevenue || 0,
                lastMonthRevenue: kpiData.lastmonthrevenue || 0,
                annualJourneyTotal: kpiData.annualjourneytotal || 0,
            });

        } catch (err) {
            console.error('Error fetching admin journey data:', err);
            setError(err);
            toast({
                title: 'Erro ao buscar dados da jornada',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [distributorType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

export default useAdminJourneyData;