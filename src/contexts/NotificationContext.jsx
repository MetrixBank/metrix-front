import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const useNotification = useNotifications;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const authData = useAuth();
  const user = authData?.user;

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      if (user.role === 'admin' || user.role === 'master-admin') {
        const { data, error } = await supabase
          .from('fnx_proposals')
          .select(`
            id,
            customer_name,
            total_value,
            created_at,
            distributor:distributor_id (name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedNotifications = (data || []).map(p => ({
          id: p.id,
          title: 'Proposta Pendente',
          message: `De ${p.distributor?.name || 'Distribuidor'} para ${p.customer_name}`,
          created_at: p.created_at,
          read: false, 
          link: '/admin/fnx-unified',
          data: p
        }));
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching initial notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialNotifications();
  }, [fetchInitialNotifications]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const newNotifications = [
        { ...notification, read: false, created_at: new Date().toISOString() }, 
        ...prev
      ];
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      return newNotifications;
    });
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const newNotifications = prev.filter(n => n.id !== notificationId);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      return newNotifications;
    });
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const newNotifications = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      return newNotifications;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const newNotifications = prev.map(n => ({ ...n, read: true }));
      setUnreadCount(0);
      return newNotifications;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification, 
      markAsRead, 
      markAllAsRead,
      unreadCount,
      loading 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};