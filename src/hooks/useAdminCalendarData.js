import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export const useAdminCalendarData = (dateRange, filters) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Default range if not provided (e.g. current month view buffer)
            const start = dateRange?.from || subMonths(new Date(), 1);
            const end = dateRange?.to || addMonths(new Date(), 2);

            // 1. Fetch Sales Opportunities (Activities)
            let activitiesQuery = supabase
                .from('sales_opportunities')
                .select(`
                    id, 
                    customer_name, 
                    visit_date, 
                    visit_time,
                    status, 
                    activity_type, 
                    notes,
                    sale_value,
                    distributor:profiles(id, name, email, distributor_type, avatar_url)
                `)
                .gte('visit_date', start.toISOString())
                .lte('visit_date', end.toISOString());

            if (filters.distributorId && filters.distributorId !== 'all') {
                activitiesQuery = activitiesQuery.eq('distributor_id', filters.distributorId);
            }
            if (filters.searchQuery) {
                activitiesQuery = activitiesQuery.ilike('customer_name', `%${filters.searchQuery}%`);
            }

            // 2. Fetch Financial Entries (if enabled)
            let financialsQuery = null;
            if (filters.showFinancials) {
                financialsQuery = supabase
                    .from('horizons_financial_entries')
                    .select(`
                        id,
                        description,
                        amount,
                        type,
                        status,
                        due_date,
                        profile:profiles(name)
                    `)
                    .gte('due_date', start.toISOString())
                    .lte('due_date', end.toISOString());
            }

            const [activitiesRes, financialsRes] = await Promise.all([
                activitiesQuery,
                financialsQuery ? financialsQuery : Promise.resolve({ data: [] })
            ]);

            if (activitiesRes.error) throw activitiesRes.error;
            if (financialsRes && financialsRes.error) throw financialsRes.error;

            // Transform Activities to Events
            const activityEvents = (activitiesRes.data || []).map(act => {
                const startDateTime = new Date(`${act.visit_date}T${act.visit_time || '09:00:00'}`);
                return {
                    id: act.id,
                    title: act.customer_name,
                    start: startDateTime,
                    end: new Date(startDateTime.getTime() + (60 * 60 * 1000)), // Default 1 hour
                    allDay: !act.visit_time,
                    type: 'activity',
                    status: act.status,
                    activityType: act.activity_type,
                    resource: act,
                    distributorName: act.distributor?.name,
                    avatarUrl: act.distributor?.avatar_url
                };
            });

            // Transform Financials to Events
            const financialEvents = (financialsRes.data || []).map(fin => ({
                id: fin.id,
                title: `${fin.type === 'income' ? '+' : '-'} ${parseFloat(fin.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${fin.description}`,
                start: new Date(fin.due_date),
                end: new Date(fin.due_date),
                allDay: true,
                type: 'financial',
                subType: fin.type,
                status: fin.status,
                resource: fin
            }));

            setEvents([...activityEvents, ...financialEvents]);

        } catch (err) {
            console.error("Calendar fetch error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, filters]);

    useEffect(() => {
        // Debounce fetch
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    return { events, loading, error, refetch: fetchData };
};