import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

const usePersonalGoals = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGoals = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (err) {
            console.error('Error fetching personal goals:', err);
            setError(err);
            toast({
                title: "Erro",
                description: "Não foi possível carregar suas metas pessoais.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchGoals();

        // Real-time subscription
        const subscription = supabase
            .channel('personal_goals_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'personal_goals', filter: `user_id=eq.${user?.id}` }, 
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setGoals(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setGoals(prev => prev.map(g => g.id === payload.new.id ? payload.new : g));
                    } else if (payload.eventType === 'DELETE') {
                        setGoals(prev => prev.filter(g => g.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchGoals]);

    const createGoal = async (goalData) => {
        try {
            const { data, error } = await supabase
                .from('personal_goals')
                .insert([{
                    user_id: user.id,
                    title: goalData.name, // Mapping name to title as per schema
                    description: goalData.description,
                    target_value: goalData.target_value,
                    current_value: 0,
                    start_date: new Date(),
                    end_date: goalData.end_date,
                    status: 'active',
                    type: 'custom',
                    metric_type: 'number',
                    is_auto_tracked: false
                }])
                .select()
                .single();

            if (error) throw error;
            toast({ title: "Sucesso", description: "Meta criada com sucesso!" });
            return data;
        } catch (err) {
            toast({ title: "Erro ao criar meta", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const updateProgress = async (goalId, currentValue) => {
        try {
            const { error } = await supabase
                .from('personal_goals')
                .update({ current_value: currentValue, updated_at: new Date() })
                .eq('id', goalId);

            if (error) throw error;
            toast({ title: "Progresso atualizado!" });
        } catch (err) {
            toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const completeGoal = async (goalId) => {
        try {
            const { error } = await supabase
                .from('personal_goals')
                .update({ 
                    status: 'completed', 
                    completed_at: new Date(),
                    updated_at: new Date() 
                })
                .eq('id', goalId);

            if (error) throw error;
            toast({ title: "Parabéns!", description: "Meta marcada como concluída." });
        } catch (err) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const deleteGoal = async (goalId) => {
        try {
            const { error } = await supabase
                .from('personal_goals')
                .delete()
                .eq('id', goalId);

            if (error) throw error;
            toast({ title: "Meta excluída" });
        } catch (err) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    return {
        goals,
        loading,
        error,
        createGoal,
        updateProgress,
        completeGoal,
        deleteGoal,
        refetch: fetchGoals
    };
};

export default usePersonalGoals;