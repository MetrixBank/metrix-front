import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cacheManager } from '@/lib/CacheManager';

export const useAdminMasterDashboardData = (dateRange) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        kpis: {
            totalRevenue: { value: 0, trend: 0, change: 0 },
            activitiesCount: { value: 0, trend: 0, change: 0 },
            completedSales: { value: 0, trend: 0, change: 0 },
            pointsGenerated: { value: 0, trend: 0, change: 0 },
            tokensInCirculation: { value: 0, trend: 0, change: 0 },
            avgRevenuePerDistributor: { value: 0, trend: 0, change: 0 },
            conversionRate: { value: 0, trend: 0, change: 0 },
            momGrowth: { value: 0, trend: 0, change: 0 }
        },
        charts: {
            revenueOverTime: [],
            productionByTeam: [],
            distributorRanking: [],
            activityFunnel: [],
            futureProjection: []
        }
    });

    const fetchData = useCallback(async () => {
        // Generate a cache key
        const fromKey = dateRange?.from ? dateRange.from.toISOString() : 'all_start';
        const toKey = dateRange?.to ? dateRange.to.toISOString() : 'all_end';
        const rangeKey = `admin_master_dashboard_${fromKey}_${toKey}`;

        // Check Cache
        const cachedData = cacheManager.get(rangeKey);
        if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Determine Date Range for Query
            let queryStartDate = null;
            let queryEndDate = null;

            if (dateRange?.from) {
                queryStartDate = startOfDay(dateRange.from).toISOString();
                queryEndDate = dateRange.to ? endOfDay(dateRange.to).toISOString() : endOfDay(new Date()).toISOString();
            }
            
            let prevStartDate = null;
            let prevEndDate = null;

            if (queryStartDate && queryEndDate) {
                const duration = new Date(queryEndDate).getTime() - new Date(queryStartDate).getTime();
                const prevEnd = new Date(new Date(queryStartDate).getTime() - 1);
                const prevStart = new Date(prevEnd.getTime() - duration);
                prevEndDate = prevEnd.toISOString();
                prevStartDate = prevStart.toISOString();
            }

            // Optimized Parallel Data Fetching with specific selects
            let salesQuery = supabase
                .from('sales_opportunities')
                .select(`
                    id, status, sale_value, visit_date, distributor_id,
                    profiles (id, name, avatar_url, distributor_type, region)
                `);
            
            if (queryStartDate) salesQuery = salesQuery.gte('visit_date', queryStartDate);
            if (queryEndDate) salesQuery = salesQuery.lte('visit_date', queryEndDate);
            
            let prevSalesQuery = supabase
                .from('sales_opportunities')
                .select('sale_value, status, visit_date, distributor_id');

            if (prevStartDate) {
                prevSalesQuery = prevSalesQuery.gte('visit_date', prevStartDate).lte('visit_date', prevEndDate);
            } else {
                prevSalesQuery = prevSalesQuery.eq('id', '00000000-0000-0000-0000-000000000000'); 
            }

            const [salesResponse, prevSalesResponse, profilesResponse, openOppsResponse] = await Promise.all([
                salesQuery,
                prevSalesQuery,
                supabase
                    .from('profiles')
                    .select('id, tokens, points, region'),

                supabase
                    .from('sales_opportunities')
                    .select('sale_value, estimated_value, status, visit_date')
                    .neq('status', 'sale_made')
                    .gte('visit_date', new Date().toISOString()) 
            ]);

            if (salesResponse.error) throw salesResponse.error;
            if (prevSalesResponse.error) throw prevSalesResponse.error;
            if (profilesResponse.error) throw profilesResponse.error;

            const sales = salesResponse.data || [];
            const prevSales = prevSalesResponse.data || [];
            const profiles = profilesResponse.data || [];
            const openOpps = openOppsResponse.data || [];

            // --- Calculations ---
            const calculateMetrics = (dataset) => {
                const totalRev = dataset.reduce((sum, item) => sum + (item.status === 'sale_made' ? (item.sale_value || 0) : 0), 0);
                const activities = dataset.length;
                const salesCount = dataset.filter(i => i.status === 'sale_made').length;
                
                const points = dataset.reduce((sum, item) => {
                    if (item.status !== 'sale_made') return sum;
                    const region = item.profiles?.region || 'BR';
                    const divisor = region === 'USA' ? 1000 : 4000;
                    return sum + ((item.sale_value || 0) / divisor);
                }, 0);

                const activeDistributors = new Set(dataset.map(d => d.distributor_id)).size;
                const avgRev = activeDistributors > 0 ? totalRev / activeDistributors : 0;
                const conversion = activities > 0 ? (salesCount / activities) * 100 : 0;

                return { totalRev, activities, salesCount, points, avgRev, conversion };
            };

            const currentMetrics = calculateMetrics(sales);
            const prevMetrics = calculateMetrics(prevSales);

            const calcTrend = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return ((curr - prev) / prev) * 100;
            };

            const totalTokens = profiles.reduce((sum, p) => sum + (p.tokens || 0), 0);
            const momGrowth = calcTrend(currentMetrics.totalRev, prevMetrics.totalRev);

            const kpis = {
                totalRevenue: { value: currentMetrics.totalRev, trend: calcTrend(currentMetrics.totalRev, prevMetrics.totalRev), change: currentMetrics.totalRev - prevMetrics.totalRev },
                activitiesCount: { value: currentMetrics.activities, trend: calcTrend(currentMetrics.activities, prevMetrics.activities), change: currentMetrics.activities - prevMetrics.activities },
                completedSales: { value: currentMetrics.salesCount, trend: calcTrend(currentMetrics.salesCount, prevMetrics.salesCount), change: currentMetrics.salesCount - prevMetrics.salesCount },
                pointsGenerated: { value: Math.floor(currentMetrics.points), trend: calcTrend(currentMetrics.points, prevMetrics.points), change: currentMetrics.points - prevMetrics.points },
                tokensInCirculation: { value: totalTokens, trend: 0, change: 0 },
                avgRevenuePerDistributor: { value: currentMetrics.avgRev, trend: calcTrend(currentMetrics.avgRev, prevMetrics.avgRev), change: currentMetrics.avgRev - prevMetrics.avgRev },
                conversionRate: { value: currentMetrics.conversion, trend: currentMetrics.conversion - prevMetrics.conversion, change: currentMetrics.conversion - prevMetrics.conversion },
                momGrowth: { value: momGrowth, trend: momGrowth, change: 0 }
            };

            // Charts Calculation Logic (Simplified for brevity, same as previous)
            let revenueOverTime = [];
            const sDate = queryStartDate ? new Date(queryStartDate) : (sales.length > 0 ? new Date(sales[sales.length-1].visit_date) : new Date());
            const eDate = queryEndDate ? new Date(queryEndDate) : new Date();
            const daysDiff = (eDate - sDate) / (1000 * 60 * 60 * 24);

            if (daysDiff <= 90 && queryStartDate) { 
                const days = eachDayOfInterval({ start: sDate, end: eDate });
                revenueOverTime = days.map(day => {
                    const daySales = sales.filter(s => s.status === 'sale_made' && isSameDay(new Date(s.visit_date), day));
                    const dailyRev = daySales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
                    return { name: format(day, 'dd/MM'), value: dailyRev, date: day };
                });
            } else {
                 const monthlyData = {};
                 sales.forEach(s => {
                    if (s.status === 'sale_made' && s.visit_date) {
                        const mKey = format(new Date(s.visit_date), 'MM/yyyy');
                        if (!monthlyData[mKey]) monthlyData[mKey] = 0;
                        monthlyData[mKey] += (s.sale_value || 0);
                    }
                 });
                 revenueOverTime = Object.keys(monthlyData)
                    .sort((a,b) => {
                        const [ma, ya] = a.split('/');
                        const [mb, yb] = b.split('/');
                        return new Date(ya, ma-1) - new Date(yb, mb-1);
                    })
                    .map(key => ({ name: key, value: monthlyData[key] }));
            }

            const distMap = {};
            sales.forEach(s => {
                if (s.status === 'sale_made') {
                    const id = s.distributor_id;
                    if (!distMap[id]) distMap[id] = { 
                        name: s.profiles?.name || 'Unknown', 
                        value: 0, 
                        avatar: s.profiles?.avatar_url 
                    };
                    distMap[id].value += (s.sale_value || 0);
                }
            });
            const productionByTeam = Object.values(distMap)
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            const distRankingMap = {};
            sales.forEach(s => {
                const id = s.distributor_id;
                if (!distRankingMap[id]) distRankingMap[id] = {
                    id,
                    name: s.profiles?.name || 'Unknown',
                    avatar: s.profiles?.avatar_url,
                    revenue: 0,
                    activities: 0,
                    sales: 0,
                    points: 0
                };
                distRankingMap[id].activities += 1;
                if (s.status === 'sale_made') {
                    distRankingMap[id].revenue += (s.sale_value || 0);
                    distRankingMap[id].sales += 1;
                    const region = s.profiles?.region || 'BR';
                    const divisor = region === 'USA' ? 1000 : 4000;
                    distRankingMap[id].points += ((s.sale_value || 0) / divisor);
                }
            });
            const distributorRanking = Object.values(distRankingMap)
                .map(d => ({
                    ...d,
                    conversionRate: d.activities > 0 ? (d.sales / d.activities) * 100 : 0
                }))
                .sort((a, b) => b.revenue - a.revenue);

            const counts = { scheduled: 0, in_progress: 0, sale_made: 0, completed_no_sale: 0 };
            sales.forEach(s => {
                if (counts[s.status] !== undefined) counts[s.status]++;
            });
            const activityFunnel = [
                { name: 'Agendados', value: counts.scheduled + counts.in_progress + counts.sale_made + counts.completed_no_sale, fill: '#3b82f6' },
                { name: 'Em Andamento', value: counts.in_progress + counts.sale_made + counts.completed_no_sale, fill: '#f59e0b' },
                { name: 'Concluídos', value: counts.sale_made + counts.completed_no_sale, fill: '#8b5cf6' },
                { name: 'Vendas', value: counts.sale_made, fill: '#10b981' }
            ];

            const globalConversion = currentMetrics.conversion / 100 || 0.15;
            const projectedValue = openOpps.reduce((sum, opp) => {
                 const val = opp.estimated_value || 0;
                 return sum + (val * globalConversion);
            }, 0);

            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const nextMonth2 = new Date();
            nextMonth2.setMonth(nextMonth2.getMonth() + 2);
            
            const futureProjection = [
                { name: format(new Date(), 'MMM', { locale: ptBR }), actual: currentMetrics.totalRev, projected: currentMetrics.totalRev },
                { name: format(nextMonth, 'MMM', { locale: ptBR }), actual: 0, projected: currentMetrics.totalRev + (projectedValue * 0.5) },
                { name: format(nextMonth2, 'MMM', { locale: ptBR }), actual: 0, projected: currentMetrics.totalRev + projectedValue },
            ];

            const newData = {
                kpis,
                charts: {
                    revenueOverTime,
                    productionByTeam,
                    distributorRanking,
                    activityFunnel,
                    futureProjection
                }
            };

            // Set Cache with 5 minute TTL
            cacheManager.set(rangeKey, newData, 5 * 60 * 1000);
            setData(newData);

        } catch (err) {
            console.error("Dashboard Data Fetch Error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); 

        return () => clearTimeout(timer);
    }, [fetchData]);

    return { ...data, loading, error };
};