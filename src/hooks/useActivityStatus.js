import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useActivityStatus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('activity_statuses')
        .select('*')
        .eq('distributor_id', user.id)
        .order('order', { ascending: true });

      if (error) throw error;
      setStatuses(data || []);
    } catch (err) {
      console.error('Error fetching statuses:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os status.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchStatuses();

    const channel = supabase
      .channel('activity_statuses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_statuses',
          filter: `distributor_id=eq.${user?.id}`,
        },
        () => {
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatuses, user?.id]);

  const addStatus = async (name, color) => {
    if (!name) return;
    
    // Calculate next order value (before the locked "Concluída com Venda" if possible)
    const unlockedStatuses = statuses.filter(s => !s.is_locked);
    const maxOrder = unlockedStatuses.length > 0 
      ? Math.max(...unlockedStatuses.map(s => s.order)) 
      : 0;
    
    const newOrder = maxOrder + 1;

    try {
      const { error } = await supabase.from('activity_statuses').insert([
        {
          distributor_id: user.id,
          name,
          color,
          order: newOrder,
          is_locked: false,
        },
      ]);

      if (error) throw error;
      toast({ title: 'Status criado', description: `O status "${name}" foi adicionado.` });
    } catch (err) {
      console.error('Error adding status:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar status.' });
    }
  };

  const updateStatus = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('activity_statuses')
        .update(updates)
        .eq('id', id)
        .eq('distributor_id', user.id); // Security check

      if (error) throw error;
      toast({ title: 'Status atualizado' });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar status.' });
    }
  };

  const removeStatus = async (id) => {
    try {
      const { error } = await supabase
        .from('activity_statuses')
        .delete()
        .eq('id', id)
        .eq('is_locked', false) // Ensure locked statuses aren't deleted via API
        .eq('distributor_id', user.id);

      if (error) throw error;
      toast({ title: 'Status removido' });
    } catch (err) {
      console.error('Error removing status:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao remover status.' });
    }
  };

  const reorderStatuses = async (reorderedStatuses) => {
    // Optimistic update
    setStatuses(reorderedStatuses);

    try {
      const updates = reorderedStatuses.map((status, index) => ({
        id: status.id,
        order: index + 1,
        distributor_id: user.id, // Needed for RLS match in some setups, good practice
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('activity_statuses')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error reordering statuses:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao reordenar status.' });
      fetchStatuses(); // Revert on error
    }
  };

  return {
    statuses,
    loading,
    addStatus,
    updateStatus,
    removeStatus,
    reorderStatuses,
    refreshStatuses: fetchStatuses
  };
};