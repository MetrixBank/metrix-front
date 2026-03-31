import React, { useEffect, useCallback, Suspense, lazy, useContext, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseListeners } from '@/hooks/useSupabaseListeners';
import AppRoutes from '@/components/routing/AppRoutes';
import { supabase } from '@/lib/supabaseClient';
import { useTutorial } from '@/contexts/TutorialContext';
import { AiAssistantContext } from '@/contexts/AiAssistantContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingFallback } from '@/components/LoadingFallback';

// Lazy load components to avoid circular dependencies and improve performance
const AiAssistant = lazy(() => import('@/components/assistant/AiAssistant.jsx'));
const AddSalesActivityModal = lazy(() => import('@/components/AddSalesActivityModal.jsx'));

const GlobalComponents = () => {
  const { user } = useAuth(); 
  const { isAssistantOpen, setAssistantOpen, activityToEdit, setActivityToEdit } = useContext(AiAssistantContext);
  const { toast } = useToast();

  const handleNavigateToCustomer = () => toast({ title: "Funcionalidade em desenvolvimento", description: "Em breve!" });
  const handleNavigateToAgenda = () => toast({ title: "Funcionalidade em desenvolvimento", description: "Em breve!" });

  const handleOpenActivityModal = (activity = null) => {
    setActivityToEdit(activity);
  };

  const handleCloseActivityModal = () => {
    setActivityToEdit(null);
  };

  if (!user) return null;

  return (
    <Suspense fallback={null}>
      <AiAssistant
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        onNavigateToCustomer={handleNavigateToCustomer}
        onNavigateToAgenda={handleNavigateToAgenda}
        onOpenActivityModal={handleOpenActivityModal}
        user={user} 
      />
      {activityToEdit !== null && (
        <AddSalesActivityModal
          isOpen={activityToEdit !== null}
          onClose={handleCloseActivityModal}
          activityData={activityToEdit}
          user={user} 
        />
      )}
    </Suspense>
  );
};

const AppLogic = () => {
  const { user, loading, signOut, session, bypassAuth } = useAuth();
  const { startTutorial, tutorialCompleted } = useTutorial();
  
  // Hooks must be called at the top level, never inside try/catch blocks
  useSupabaseListeners(user, signOut, bypassAuth);

  useEffect(() => {
    if (!loading) {
      try {
        sessionStorage.removeItem('metrix_auto_reload');
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [loading]);

  const checkTutorialEligibility = useCallback(async (userId) => {
    if (!userId) return false;
    
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('distributor_id', userId);

      if (error) {
        console.warn("Warning checking product count for tutorial:", error.message);
        return false;
      }
      
      return count === 0;

    } catch (error) {
      console.error('Error in checkTutorialEligibility:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAndStartTutorial = async () => {
      if (!session || !user || bypassAuth) return;

      try {
        if (user.id && user.role === 'distributor' && !tutorialCompleted) {
          const isEligible = await checkTutorialEligibility(user.id);
          if (mounted && isEligible) {
            startTutorial();
          }
        }
      } catch (err) {
        console.error("Error starting tutorial:", err);
      }
    };

    if (!loading) {
      checkAndStartTutorial();
    }

    return () => {
      mounted = false;
    };
  }, [user, loading, startTutorial, checkTutorialEligibility, tutorialCompleted, session, bypassAuth]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <AppRoutes />
      <GlobalComponents />
    </div>
  );
};

export default AppLogic;