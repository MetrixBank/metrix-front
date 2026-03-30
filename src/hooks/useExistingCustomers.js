import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useExistingCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('distributor_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;

        if (mounted) {
          setCustomers(data || []);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase().trim();
    return customers.filter(customer => 
      (customer.name && customer.name.toLowerCase().includes(query)) ||
      (customer.email && customer.email.toLowerCase().includes(query)) ||
      (customer.phone && customer.phone.includes(query))
    );
  }, [customers, searchQuery]);

  const searchCustomers = (query) => {
    setSearchQuery(query);
  };

  return {
    customers,
    searchResults,
    loading,
    error,
    searchCustomers
  };
};