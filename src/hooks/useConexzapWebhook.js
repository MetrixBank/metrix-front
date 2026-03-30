import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export function useConexzapWebhook() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callWebhook = useCallback(async (payload, apiKey) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conexzap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Webhook request failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Webhook Error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateApiKey = useCallback(async (distributorId) => {
    setLoading(true);
    try {
      // Logic to generate a new key row in distributor_api_keys
      // Using a random string generator for the key
      const newKey = `cz_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
      
      const { data, error } = await supabase
        .from('distributor_api_keys')
        .insert({
          distributor_id: distributorId,
          key_hash: newKey, // In prod, hash this. Here storing raw for visibility as requested.
          key_name: 'ConexZap Integration Key',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "API Key Generated",
        description: "New ConexZap integration key created successfully.",
      });

      return { success: true, key: newKey, data };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API Key: " + error.message,
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    callWebhook,
    generateApiKey,
    loading
  };
}