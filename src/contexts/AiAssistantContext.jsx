import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useToast } from '@/components/ui/use-toast';

export const AiAssistantContext = createContext();

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error('useAiAssistant must be used within an AiAssistantProvider');
  }
  return context;
};

// Export alias for backward compatibility if needed
export const useAiAssistantContext = useAiAssistant;

export const AiAssistantProvider = ({ children }) => {
  const { user } = useAuth();
  const { syncKey } = useDataSync();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  
  // New Settings State
  const [aiSettings, setAiSettings] = useState({
      enabled: true,
      preferredTone: 'casual',
      autoAnalyze: false
  });

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_assistant_tasks')
        .select(`*`)
        .eq('distributor_id', user.id)
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;
      
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching AI tasks:', err);
      setError(err.message);
      // Don't show toast on initial load failure to avoid spamming user, 
      // but keep the error state accessible
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
    
    // Load settings from local storage safely
    try {
      const savedSettings = localStorage.getItem('ai_settings');
      if (savedSettings) {
          setAiSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.warn('Failed to parse AI settings from local storage', e);
    }
  }, [fetchTasks, syncKey]);

  const updateSettings = (newSettings) => {
      try {
        const updated = { ...aiSettings, ...newSettings };
        setAiSettings(updated);
        localStorage.setItem('ai_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save AI settings', e);
        toast({
          title: "Erro ao salvar configurações",
          description: "Não foi possível salvar suas preferências.",
          variant: "destructive"
        });
      }
  };

  const pendingTasksCount = tasks.filter(task => task.status === 'pending').length;

  const value = {
    tasks,
    isLoading,
    error,
    refreshTasks: fetchTasks,
    pendingTasksCount,
    isAssistantOpen,
    setAssistantOpen,
    activityToEdit,
    setActivityToEdit,
    aiSettings,
    updateSettings
  };

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
    </AiAssistantContext.Provider>
  );
};