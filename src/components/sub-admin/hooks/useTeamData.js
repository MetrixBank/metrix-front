import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useDataSync } from '@/contexts/DataSyncContext';

const useTeamData = (subAdminId) => {
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
            const { data: teamData, error: rpcError } = await supabase.rpc('get_team_overview_data', {
                p_sub_admin_id: subAdminId
            });

            if (rpcError) throw rpcError;
            
            setData(teamData);

        } catch (err) {
            console.error("Error fetching team data:", err);
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
        fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        if (data !== null) { 
            fetchData(false);
        }
    }, [syncKey, fetchData]);

    return { data, loading, error, refetch: () => fetchData(true) };
};

export default useTeamData;