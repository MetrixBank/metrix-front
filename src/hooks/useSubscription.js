import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useSubscription = () => {
  const { user } = useAuth();
  
  // Always return premium status to unlock all features for everyone
  return {
    subscription: {
        status: 'active',
        plan_type: 'unlimited',
        current_period_end: new Date('2099-12-31').toISOString(),
        stripe_subscription_id: 'unlimited_access'
    },
    loading: false,
    isPremium: true, // Force true for all users
    error: null,
    refreshSubscription: () => {},
    planType: 'unlimited',
    subscriptionStatus: 'active',
    currentPeriodEnd: new Date('2099-12-31').toISOString(),
    stripeSubscriptionId: 'unlimited_access',
    isLegacyPremium: true
  };
};