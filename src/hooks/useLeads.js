import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch leads for current user
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`user_id.eq.${user.id},distributor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar leads',
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads
  };
};