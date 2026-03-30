import { supabase } from '@/lib/supabaseClient';

/**
 * Client-side utility to test the ConexZap Supabase Edge Function.
 * This function invokes the 'conexzap' function via the Supabase client.
 * 
 * @param {Object} data - The payload to send { nome, telefone, mensagem, data_hora }
 * @param {string} [apiKey] - Opcional. Se omitido, usa `import.meta.env.VITE_CONEXZAP_API_KEY`.
 * @returns {Promise<Object>} The response data from the edge function
 */
export const testConexZapWebhook = async (data, apiKey) => {
  try {
    const keyToUse = apiKey || import.meta.env.VITE_CONEXZAP_API_KEY;
    if (!keyToUse) {
      console.error('ConexZap: defina VITE_CONEXZAP_API_KEY no .env ou passe apiKey como argumento.');
      return {
        success: false,
        error: 'Chave de API não configurada (VITE_CONEXZAP_API_KEY).',
        code: 'MISSING_API_KEY'
      };
    }

    console.log('Invoking ConexZap Edge Function...');
    
    const { data: response, error } = await supabase.functions.invoke('conexzap', {
      body: data,
      headers: {
        'x-api-key': keyToUse,
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('Supabase Function Invocation Error:', error);
      // Return a structured error similar to the API response for consistency in UI handling
      return {
        success: false,
        error: error.message || 'Failed to invoke function',
        code: 'INVOCATION_ERROR'
      };
    }
    
    // The invoke method usually parses JSON automatically, but response might be the data directly
    return response;

  } catch (err) {
    console.error('Unexpected error in testConexZapWebhook:', err);
    return {
      success: false,
      error: err.message || 'Unexpected client error',
      code: 'CLIENT_ERROR'
    };
  }
};