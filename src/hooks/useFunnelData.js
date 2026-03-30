import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useFunnelData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('funnel_stages')
        .select('*')
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .order('stage_order');

      if (stagesError) throw stagesError;

      // 2. Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .or(`user_id.eq.${user.id},distributor_id.eq.${user.id}`)
        .order('last_activity_at', { ascending: false });

      if (leadsError) throw leadsError;

      setStages(stagesData || []);
      setLeads(leadsData || []);

    } catch (err) {
      console.error('Error fetching funnel data:', err);
      setError(err);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível carregar seus leads.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    fetchData();

    const channel = supabase
      .channel('funnel_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead => lead.id === payload.new.id ? payload.new : lead));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Actions
  const createLead = async (leadData) => {
    try {
      const { data, error } = await supabase.from('leads').insert([{
        ...leadData,
        user_id: user.id,
        distributor_id: user.id
      }]).select().single();

      if (error) throw error;
      toast({ title: 'Lead criado', description: `${data.name} adicionado ao funil.` });
      return data;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao criar', description: err.message });
      throw err;
    }
  };

  const updateLeadStage = async (leadId, newStageId) => {
    // Optimistic update
    const previousLeads = [...leads];
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage_id: newStageId } : l));

    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage_id: newStageId })
        .eq('id', leadId);

      if (error) throw error;

      // Log system message
      const stageName = stages.find(s => s.id === newStageId)?.name || 'Nova Etapa';
      await supabase.from('lead_messages').insert({
        lead_id: leadId,
        sender: 'system',
        message: `Mudou para a etapa: ${stageName}`,
        event_type: 'stage_change'
      });

    } catch (err) {
      setLeads(previousLeads); // Revert
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: err.message });
    }
  };

  return {
    stages,
    leads,
    loading,
    error,
    createLead,
    updateLeadStage,
    refreshLeads: fetchData
  };
};