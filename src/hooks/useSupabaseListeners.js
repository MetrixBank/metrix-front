import { useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Howl } from 'howler';
import { formatCurrency } from '@/lib/utils';
import { NotificationContext } from '@/contexts/NotificationContext';
import { AiAssistantContext } from '@/contexts/AiAssistantContext';

const adminNotificationSound = new Howl({ 
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-cash-register-swoosh-1488.mp3'], 
    volume: 0.5,
    preload: true,
});

const proposalNotificationSound = new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-interface-option-select-2573.mp3'],
    volume: 0.6,
    preload: true,
});

export const useSupabaseListeners = (user, onLogout, bypassAuth = false) => {
    const notificationContext = useContext(NotificationContext);
    const assistantContext = useContext(AiAssistantContext);

    useEffect(() => {
        if (bypassAuth) return;

        let profileSubscription = null;
        let presenceChannel = null;

        if (user && user.id) {
          profileSubscription = supabase
            .channel(`app-profile-channel-${user.id}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
              (payload) => {
                if (payload.new) {
                  toast({ title: 'Seu Perfil Foi Atualizado!', description: 'Suas informações foram sincronizadas.'});
                }
              }
            )
            .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') console.log('Subscribed to profile channel for user:', user.id);
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                  console.error('Profile channel error/closed:', user.id, status, err);
                  // Check if error is related to auth/session
                  if (err && (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT'))) {
                      console.warn('Session invalid during listener subscription, logging out.');
                      if (onLogout) onLogout();
                  }
              }
            });

          presenceChannel = supabase.channel('online-users', {
            config: { presence: { key: user.id } },
          });

          presenceChannel.subscribe(async (status, err) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({ 
                online_at: new Date().toISOString(),
                user_id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                role: user.role
              });
            }
            if (status === 'CHANNEL_ERROR' && err) {
                 if (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT')) {
                      console.warn('Session invalid during presence subscription, logging out.');
                      if (onLogout) onLogout();
                  }
            }
          });
        }

        return () => {
          if (profileSubscription) supabase.removeChannel(profileSubscription);
          if (presenceChannel) supabase.removeChannel(presenceChannel);
        };
    }, [user, onLogout, bypassAuth]);

    useEffect(() => {
        if (bypassAuth) return;
        if (!user || !notificationContext || !assistantContext) return;
        
        const { addNotification } = notificationContext;
        const { refreshTasks } = assistantContext;

        if (user.role === 'distributor') {
             const assistantTaskChannel = supabase
                .channel(`assistant-tasks-channel-${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_assistant_tasks', filter: `distributor_id=eq.${user.id}` },
                    (payload) => {
                        console.log('AI Assistant Task Change Detected:', payload);
                        refreshTasks();
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' && err) {
                        if (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT')) {
                            if (onLogout) onLogout();
                        }
                    }
                });

             return () => {
                supabase.removeChannel(assistantTaskChannel);
             };
        }
    }, [user, assistantContext, onLogout, bypassAuth]);


    useEffect(() => {
        if (bypassAuth) return;
        if (!user || !notificationContext) return;
        
        const { addNotification } = notificationContext;

        if (user.role === 'admin') {
            const handleNewActivityNotification = async (payload) => {
                const newActivity = payload.new;
                try {
                    const { data: distributor } = await supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', newActivity.distributor_id)
                        .single();
                    
                    const distributorName = distributor?.name || 'Desconhecido';

                    if (newActivity.status === 'sale_made') {
                        adminNotificationSound.play();
                        toast({
                            title: '💰 Nova Venda Registrada!',
                            description: `O distribuidor ${distributorName} registrou uma venda de ${formatCurrency(newActivity.sale_value || 0)}. TRACATRAAA 🦅`,
                            duration: 10000,
                        });
                    } else {
                        toast({
                            title: '🔔 Nova Atividade Registrada',
                            description: `O distribuidor ${distributorName} registrou uma nova atividade para ${newActivity.customer_name}.`,
                            duration: 7000,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching distributor for notification:', error);
                }
            };

            const handleNewProposalNotification = async (payload) => {
                const newProposal = payload.new;
                try {
                    const { data: distributor } = await supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', newProposal.distributor_id)
                        .single();
                    
                    const distributorName = distributor?.name || 'Desconhecido';
                    
                    const notification = {
                      id: newProposal.id,
                      title: 'Nova Proposta Recebida!',
                      description: `De ${distributorName} para ${newProposal.customer_name}`,
                      data: newProposal,
                    };

                    addNotification(notification);
                    proposalNotificationSound.play();
                    toast({
                        title: '📬 Nova Proposta Recebida!',
                        description: `Distribuidor ${distributorName} enviou uma proposta de ${formatCurrency(newProposal.total_value)} para análise.`,
                        duration: 15000,
                    });
                } catch (error) {
                    console.error('Error fetching distributor for proposal notification:', error);
                }
            };

            const activityChannel = supabase
                .channel('admin-activity-notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales_opportunities' }, handleNewActivityNotification)
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' && err) {
                        if (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT')) {
                            if (onLogout) onLogout();
                        }
                    }
                });

            const proposalChannel = supabase
                .channel('admin-proposal-notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fnx_proposals', filter: 'status=eq.pending' }, handleNewProposalNotification)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fnx_proposals', filter: 'status=eq.pending' }, (payload) => {
                    if (payload.old.status !== 'pending') {
                        handleNewProposalNotification(payload);
                    }
                })
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' && err) {
                        if (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT')) {
                            if (onLogout) onLogout();
                        }
                    }
                });

            return () => {
                supabase.removeChannel(activityChannel);
                supabase.removeChannel(proposalChannel);
            };
        }

        if (user.role === 'distributor') {
            const handleProposalUpdate = (payload) => {
                const updatedProposal = payload.new;

                if (updatedProposal.status === 'approved' && payload.old.status !== 'approved') {
                    proposalNotificationSound.play();
                    toast({
                        title: '🎉 Proposta Aprovada!',
                        description: 'Em breve, nossa equipe entrará em contato para finalizar o contrato e liberar os produtos.',
                        duration: 15000,
                        className: 'bg-green-100 border-green-300 text-green-800'
                    });
                } else if (updatedProposal.status === 'rejected' && payload.old.status !== 'rejected') {
                    proposalNotificationSound.play();
                    toast({
                        title: '⚠️ Proposta Recusada',
                        description: 'Sua proposta foi recusada. Verifique os detalhes ou entre em contato para mais informações.',
                        variant: 'destructive',
                        duration: 15000
                    });
                } else if (updatedProposal.status === 'review' && payload.old.status !== 'review') {
                    proposalNotificationSound.play();
                    toast({
                        title: '📝 Proposta em Revisão',
                        description: 'Sua proposta está sendo revisada. Pode haver solicitações de ajuste.',
                        duration: 10000
                    });
                }
            };
            
            const distributorProposalChannel = supabase
                .channel(`distributor-proposal-channel-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'fnx_proposals', filter: `distributor_id=eq.${user.id}` },
                    handleProposalUpdate
                )
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' && err) {
                        if (err.code === 403 || err.message?.includes('session') || err.message?.includes('JWT')) {
                            if (onLogout) onLogout();
                        }
                    }
                });
            
            return () => {
                supabase.removeChannel(distributorProposalChannel);
            };
        }
    }, [user, notificationContext, onLogout, bypassAuth]);
};