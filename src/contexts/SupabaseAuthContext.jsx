import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

// Create the context
export const AuthContext = createContext(undefined);

// Export the provider
export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  }, []);

  const clearLocalAuth = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    
    // Aggressively clear local storage to prevent stuck states
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key === 'supabase.auth.token')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn("Failed to clear local storage:", e);
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    if (!currentSession) {
        clearLocalAuth();
        return;
    }

    // Validate token existence/expiry before setting session
    if (!currentSession.access_token || !currentSession.refresh_token) {
        console.warn("Invalid session structure detected, clearing auth.");
        clearLocalAuth();
        return;
    }

    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
      await fetchProfile(currentUser.id);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [fetchProfile, clearLocalAuth]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
        .channel(`profile_changes_${user.id}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`,
            },
            (payload) => {
                console.log('Realtime profile update detected:', payload);
                fetchProfile(user.id);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token') ||
              error.status === 400 ||
              error.status === 403) {
            console.warn("Refresh token invalid or session not found, clearing session to force re-auth.");
            if (mounted) clearLocalAuth();
            return;
          }
          console.error("Error getting session:", error);
          if (mounted) clearLocalAuth();
          return;
        }

        if (mounted) {
          await handleSession(session);
        }
      } catch (error) {
        console.error("Unexpected error in session check:", error);
        if (mounted) clearLocalAuth();
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log(`Auth event: ${event}`);

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            clearLocalAuth();
        } else if (event === 'TOKEN_REFRESH_ROUTINE_COMPLETED') {
            // Routine check completed, do nothing
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await handleSession(session);
        } else if (event === 'INITIAL_SESSION') {
            await handleSession(session);
        } else {
            // Fallback for other events
            await handleSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession, clearLocalAuth]);

  const signUp = useCallback(async (email, password, options) => {
    const browserLang = navigator.language || navigator.userLanguage;
    const detectedRegion = browserLang && browserLang.startsWith('en') ? 'USA' : 'BR';
    
    const enrichedOptions = {
        ...options,
        data: {
            ...options?.data,
            region: options?.data?.region || detectedRegion
        }
    };

    const { error } = await supabase.auth.signUp({ email, password, options: enrichedOptions });
    if (error) {
      toast({ variant: "destructive", title: "Sign up Failed", description: error.message || "Something went wrong" });
    }
    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (!error.message.includes("Invalid login credentials")) {
          toast({ variant: "destructive", title: "Sign in Failed", description: error.message || "Something went wrong" });
      }
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      const isIgnorableError = error && (
        error.code === 403 || 
        error.status === 403 ||
        error.status === 401 ||
        error.message?.includes("session_id claim in JWT does not exist") || 
        error.message?.includes("Auth session missing") ||
        error.message?.includes("JWT") ||
        error.message?.includes("refresh_token_not_found") ||
        error.message?.includes("session_not_found")
      );

      if (error && !isIgnorableError) {
        console.error("Sign out error:", error);
      }
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      return { error: null };
    } finally {
      clearLocalAuth();
    }
  }, [clearLocalAuth]);

  const handleProfileUpdate = useCallback(async (updates) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user: profile ? { ...user, ...profile } : user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    handleProfileUpdate,
  }), [user, profile, session, loading, signUp, signIn, signOut, handleProfileUpdate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};