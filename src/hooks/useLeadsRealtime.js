import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2 } from 'lucide-react';

export function useLeadsRealtime() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Ref to keep track of current leads without dependency cycles in subscription
  const leadsRef = useRef([]);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const fetchLeads = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLeads(data || []);
      setLastUpdate(new Date());
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
  };

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchLeads();

    // Set up Realtime subscription
    const channel = supabase
      .channel('leads-realtime-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user.id}`, // Filter by current user
        },
        (payload) => {
          console.log('Realtime event received:', payload);
          setLastUpdate(new Date());

          if (payload.eventType === 'INSERT') {
            const newLead = payload.new;
            setLeads((prev) => [newLead, ...prev]);
            
            // Show toast notification
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Novo Lead Recebido!</span>
                </div>
              ),
              description: `${newLead.name} - ${newLead.phone}`,
              duration: 5000,
              className: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
            });
            
            // Optional sound effect could go here
          } 
          else if (payload.eventType === 'UPDATE') {
            setLeads((prev) => 
              prev.map((lead) => (lead.id === payload.new.id ? payload.new : lead))
            );
          } 
          else if (payload.eventType === 'DELETE') {
            setLeads((prev) => 
              prev.filter((lead) => lead.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    isConnected,
    lastUpdate
  };
}