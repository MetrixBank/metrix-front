import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

export const useCustomerTaskSync = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
    
    // Use refs to keep track of current state inside subscriptions without triggering re-runs
    const customersRef = useRef([]);
    const tasksRef = useRef([]);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setSyncStatus('syncing');
        try {
            const [custRes, taskRes] = await Promise.all([
                supabase.from('customers').select('*').eq('distributor_id', user.id).order('name'),
                supabase.from('ai_assistant_tasks').select('*').eq('distributor_id', user.id)
            ]);

            if (custRes.error) throw custRes.error;
            if (taskRes.error) throw taskRes.error;

            setCustomers(custRes.data || []);
            setTasks(taskRes.data || []);
            
            customersRef.current = custRes.data || [];
            tasksRef.current = taskRes.data || [];
            
            setSyncStatus('idle');
        } catch (error) {
            console.error("Sync fetch error:", error);
            setSyncStatus('error');
            toast({ title: "Erro de Sincronização", description: "Falha ao carregar dados.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user]);

    // --- Subscriptions ---
    useEffect(() => {
        if (!user) return;
        
        fetchData();

        const customerChannel = supabase.channel('public:customers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `distributor_id=eq.${user.id}` }, 
                (payload) => {
                    handleCustomerChange(payload);
                }
            )
            .subscribe();

        const taskChannel = supabase.channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_assistant_tasks', filter: `distributor_id=eq.${user.id}` }, 
                (payload) => {
                    handleTaskChange(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(customerChannel);
            supabase.removeChannel(taskChannel);
        };
    }, [user, fetchData]);

    // --- Event Handlers ---
    const handleCustomerChange = (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        let updatedList = [...customersRef.current];

        if (eventType === 'INSERT') {
            updatedList.push(newRecord);
        } else if (eventType === 'UPDATE') {
            updatedList = updatedList.map(c => c.id === newRecord.id ? newRecord : c);
            // Sync tasks if customer details critical for display changed? 
            // Usually tasks reference ID, so display logic handles it by joining on ID.
        } else if (eventType === 'DELETE') {
            updatedList = updatedList.filter(c => c.id !== oldRecord.id);
        }

        // Sort by name for consistency
        updatedList.sort((a, b) => a.name.localeCompare(b.name));
        
        setCustomers(updatedList);
        customersRef.current = updatedList;
    };

    const handleTaskChange = (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        let updatedList = [...tasksRef.current];

        if (eventType === 'INSERT') {
            updatedList.push(newRecord);
        } else if (eventType === 'UPDATE') {
            updatedList = updatedList.map(t => t.id === newRecord.id ? newRecord : t);
        } else if (eventType === 'DELETE') {
            updatedList = updatedList.filter(t => t.id !== oldRecord.id);
        }
        
        setTasks(updatedList);
        tasksRef.current = updatedList;
    };

    // --- Utility Functions ---
    const getCustomerWithTasks = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        const customerTasks = tasks.filter(t => t.customer_id === customerId);
        return { ...customer, tasks: customerTasks };
    };

    return {
        customers,
        tasks,
        loading,
        syncStatus,
        refetch: fetchData,
        getCustomerWithTasks
    };
};