import { supabase } from '@/lib/supabaseClient';

// IDs de preço Stripe — configure VITE_STRIPE_PRICE_* no .env
export const STRIPE_PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
export const STRIPE_PRICE_ANNUAL = import.meta.env.VITE_STRIPE_PRICE_ANNUAL;

/**
 * Helper to get the current session token for authenticated requests
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('User is not authenticated');
  }
  return {
    Authorization: `Bearer ${session.access_token}`
  };
};

export const createCheckoutSession = async (userId, email, planType = 'monthly') => {
  console.log(`[StripeUtils] Starting checkout session creation. User: ${userId}, Plan: ${planType}`);
  
  try {
    // Validate inputs
    if (!userId || !email) {
        console.error('[StripeUtils] Validation Failed: Missing userId or email');
        throw new Error('User ID and Email are required for checkout.');
    }

    // Determine Price ID based on plan type
    let targetPriceId;
    if (planType === 'annual') {
        targetPriceId = STRIPE_PRICE_ANNUAL;
    } else {
        targetPriceId = STRIPE_PRICE_MONTHLY;
    }
    
    // Safety check for valid price ID format (must start with price_)
    if (!targetPriceId || !targetPriceId.startsWith('price_')) {
        console.error(`[StripeUtils] Invalid Price ID configuration: ${targetPriceId}`);
        throw new Error('Erro de configuração do produto. ID do preço inválido.');
    }
    
    console.log(`[StripeUtils] Using Price ID: ${targetPriceId}`);

    // Ensure user is authenticated before making the request
    const headers = await getAuthHeaders();

    console.log('[StripeUtils] Invoking Edge Function: create-checkout-session');
    
    // Invoke the function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        userId, 
        email, 
        planType: planType || 'monthly', 
        priceId: targetPriceId, // Explicitly sending the validated Price ID
        returnUrl: window.location.origin + '/subscription' 
      },
      headers: headers
    });

    if (error) {
      console.error('[StripeUtils] Edge Function Error:', error);
      let message = error.message || 'Falha ao iniciar o checkout';
      
      // Attempt to parse detailed error from function response
      try {
         if (error.context && typeof error.context.json === 'function') {
             const errorBody = await error.context.json();
             if (errorBody.error) message = errorBody.error;
         } else if (typeof error === 'string') {
             const parsed = JSON.parse(error);
             if (parsed.error) message = parsed.error;
         }
      } catch (e) {
          // ignore parsing error
      }
      throw new Error(message);
    }

    if (!data?.sessionId && !data?.url) {
      console.error('[StripeUtils] Invalid response data received:', data);
      throw new Error('Não foi possível obter a sessão de checkout. Tente novamente.');
    }

    console.log('[StripeUtils] Checkout session created successfully.');
    return data;
  } catch (error) {
    console.error('[StripeUtils] Critical Error in createCheckoutSession:', error);
    throw error; 
  }
};

export const getStripeCustomerPortalUrl = async () => {
  try {
    const headers = await getAuthHeaders();

    const { data, error } = await supabase.functions.invoke('stripe-manager', {
      body: { action: 'create_portal', returnUrl: window.location.origin + '/subscription' },
      headers: headers
    });
    
    if (error) {
      console.error('Edge Function Error (stripe-manager/portal):', error);
      throw new Error(error.message || 'Failed to get portal URL');
    }

    return data.url;
  } catch (error) {
    console.error('Error getting portal URL:', error);
    throw error;
  }
};

export const cancelSubscriptionInStripe = async () => {
  try {
    const headers = await getAuthHeaders();

    const { data, error } = await supabase.functions.invoke('stripe-manager', {
      body: { action: 'cancel_subscription' },
      headers: headers
    });

    if (error) {
      console.error('Edge Function Error (stripe-manager/cancel):', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async (userId) => {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Database Error (getSubscriptionStatus):', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error in getSubscriptionStatus:', err);
    return null;
  }
};