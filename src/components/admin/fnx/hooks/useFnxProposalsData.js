import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const useFnxProposalsData = (initialStartDate, initialEndDate) => {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [data, setData] = useState({
        total_proposals_sent: 0,
        total_approved: 0,
        approval_rate: 0,
        total_released_cost: 0,
        total_fnx_value: 0,
        monthly_cashflow: [],
        portfolio_summary: { paid: 0, pending: 0, overdue: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    const fetchData = useCallback(async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const formattedStart = format(start, 'yyyy-MM-dd');
            const formattedEnd = format(end, 'yyyy-MM-dd');

            const { data: rpcData, error: rpcError } = await supabase.rpc('get_fnx_dashboard_analytics', {
                p_start_date: formattedStart,
                p_end_date: formattedEnd,
            });

            if (rpcError) throw rpcError;

            setData(rpcData);

        } catch (err) {
            console.error('Error fetching FNX proposals data:', err);
            setError(err.message);
            toast({
                title: 'Erro ao Carregar Análises FNX',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData(startDate, endDate);
    }, []); // Initial fetch

    const refetch = useCallback((newStart, newEnd) => {
        setStartDate(newStart);
        setEndDate(newEnd);
        fetchData(newStart, newEnd);
    }, [fetchData]);

    return { data, loading, error, refetch };
};

export default useFnxProposalsData;