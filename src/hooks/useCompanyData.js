import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { startOfDay, subDays, formatISO } from 'date-fns';
import { useDataSync } from '@/contexts/DataSyncContext';

const POINTS_PER_CURRENCY_UNIT = 4000.0;

const aggregatePerformanceData = (opps, monthFilter = "all") => {
    const kpis = {
        totalVisits: 0, totalSales: 0, totalRevenue: 0, totalCostOfGoods: 0,
        totalCommissions: 0, totalOtherCosts: 0, totalNetProfit: 0, conversionRate: 0,
        points: 0,
    };
    const monthlyMap = new Map();
    const consultantMap = new Map();
    const productSalesMap = new Map();
    const productProfitMap = new Map();

    const filteredOpps = (opps || []).filter(op => {
        if (monthFilter === "all") return true;
        if (!op.visit_date) return false;
        const opVisitDate = startOfDay(new Date(op.visit_date + 'T00:00:00'));
        const opMonthYear = `${opVisitDate.getUTCFullYear()}-${String(opVisitDate.getUTCMonth() + 1).padStart(2, '0')}`;
        return opMonthYear === monthFilter;
    });

    filteredOpps.forEach(op => {
        kpis.totalVisits += 1;
        
        const visitDate = startOfDay(new Date(op.visit_date + 'T00:00:00'));
        const visitMonth = visitDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });

        if (!monthlyMap.has(visitMonth)) {
        monthlyMap.set(visitMonth, {
            month: visitMonth, totalVisits: 0, totalSales: 0, totalRevenue: 0,
            totalCostOfGoods: 0, totalCommissions: 0, totalOtherCosts: 0, totalNetProfit: 0, averageTicket: 0,
        });
        }
        const monthData = monthlyMap.get(visitMonth);
        monthData.totalVisits += 1;

        const consultant = op.consultant_name || 'Não Especificado';
        if (!consultantMap.has(consultant)) {
            consultantMap.set(consultant, { name: consultant, visits: 0, sales: 0, revenue: 0, commission: 0 });
        }
        const consultantData = consultantMap.get(consultant);
        consultantData.visits += 1;

        if (op.status === 'sale_made') {
        const salesCount = op.sales_count_for_activity || 1;
        const commission = parseFloat(op.commission_value) || 0;
        const otherCosts = parseFloat(op.other_costs) || 0;
        
        kpis.totalSales += salesCount;
        kpis.totalCommissions += commission;
        kpis.totalOtherCosts += otherCosts;
        
        let costOfGoodsForSale = 0;
        let revenueForSale = 0;
        
        if (op.opportunity_products && op.opportunity_products.length > 0) {
            op.opportunity_products.forEach(item => {
            const itemCost = (parseFloat(item.quantity_sold) || 0) * (parseFloat(item.unit_cost_price_at_sale) || 0);
            const itemRevenue = (parseFloat(item.quantity_sold) || 0) * (parseFloat(item.unit_sale_price_at_sale) || 0);
            const itemProfit = itemRevenue - itemCost;
            
            costOfGoodsForSale += itemCost;
            revenueForSale += itemRevenue;

            const productName = item.products?.name || 'Produto Desconhecido';

            if (!productSalesMap.has(item.product_id)) {
                productSalesMap.set(item.product_id, { id: item.product_id, name: productName, totalRevenue: 0 });
            }
            productSalesMap.get(item.product_id).totalRevenue += itemRevenue;

            if (!productProfitMap.has(item.product_id)) {
                productProfitMap.set(item.product_id, { id: item.product_id, name: productName, totalProfit: 0 });
            }
            productProfitMap.get(item.product_id).totalProfit += itemProfit;
            });
        } else {
            revenueForSale = parseFloat(op.sale_value) || 0;
            costOfGoodsForSale = revenueForSale * 0.6;
        }
        
        kpis.totalRevenue += revenueForSale;
        kpis.totalCostOfGoods += costOfGoodsForSale;
        kpis.points += costOfGoodsForSale / POINTS_PER_CURRENCY_UNIT;
        
        const netProfitForSale = revenueForSale - costOfGoodsForSale - commission - otherCosts;
        kpis.totalNetProfit += netProfitForSale;

        monthData.totalSales += salesCount;
        monthData.totalRevenue += revenueForSale;
        monthData.totalCostOfGoods += costOfGoodsForSale;
        monthData.totalCommissions += commission;
        monthData.totalOtherCosts += otherCosts;
        monthData.totalNetProfit += netProfitForSale;
        
        consultantData.sales += salesCount;
        consultantData.revenue += revenueForSale;
        consultantData.commission += commission;
        }
    });

    if (kpis.totalVisits > 0) {
        kpis.conversionRate = (kpis.totalSales / kpis.totalVisits) * 100;
    }
    
    const monthlyAggregates = Array.from(monthlyMap.values()).sort((a, b) => {
        const [monthAStr, yearAStr] = a.month.split(' de ');
        const [monthBStr, yearBStr] = b.month.split(' de ');
        const monthMap = { 'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5, 'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11 };
        const dateA = new Date(parseInt(yearAStr), monthMap[monthAStr.toLowerCase()]);
        const dateB = new Date(parseInt(yearBStr), monthMap[monthBStr.toLowerCase()]);
        return dateA - dateB;
    });
    
    monthlyAggregates.forEach(m => {
        m.conversionRate = m.totalVisits > 0 ? (m.totalSales / m.totalVisits) * 100 : 0;
        m.averageTicket = m.totalSales > 0 ? m.totalRevenue / m.totalSales : 0;
    });

    const consultantPerformance = Array.from(consultantMap.values());
    const topSellingProducts = Array.from(productSalesMap.values()).sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0,5);
    const mostProfitableProducts = Array.from(productProfitMap.values()).sort((a,b) => b.totalProfit - a.totalProfit).slice(0,5);

    return { kpis, monthlyAggregates, consultantPerformance, topSellingProducts, mostProfitableProducts };
};

export const useCompanyData = (user) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        opportunities: [],
        products: [],
        customers: [],
        hasPendingTasks: false,
    });
    const [performanceData, setPerformanceData] = useState({
        kpis: {},
        monthlyAggregates: [],
        consultantPerformance: [],
        topSellingProducts: [],
        mostProfitableProducts: [],
    });
    const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
    const { syncKey, triggerSync } = useDataSync();

    const checkForPendingTasks = useCallback(async () => {
        if (!user?.id) return;
        
        const oldDateLimit = formatISO(subDays(new Date(), 7), { representation: 'date' });

        try {
            const [tasksResponse, oldActivitiesResponse] = await Promise.all([
                supabase
                    .from('ai_assistant_tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('distributor_id', user.id)
                    .eq('status', 'pending'),
                supabase
                    .from('sales_opportunities')
                    .select('id', { count: 'exact', head: true })
                    .eq('distributor_id', user.id)
                    .in('status', ['scheduled', 'in_progress'])
                    .lt('visit_date', oldDateLimit)
            ]);

            const hasTasks = (tasksResponse.count || 0) > 0;
            const hasOldActivities = (oldActivitiesResponse.count || 0) > 0;

            setData(prev => ({...prev, hasPendingTasks: hasTasks || hasOldActivities}));

        } catch (error) {
            console.error("Error checking for pending tasks:", error);
        }
    }, [user]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [oppsResponse, prodsResponse, custsResponse] = await Promise.all([
                supabase.from('sales_opportunities')
                    .select(`*, opportunity_products (*, products (name, sku))`)
                    .eq('distributor_id', user.id)
                    .order('visit_date', { ascending: false })
                    .order('created_at', { ascending: false }),
                supabase.from('products').select('*').eq('distributor_id', user.id).order('name', { ascending: true }),
                supabase.from('customers').select('*').eq('distributor_id', user.id).order('name', { ascending: true })
            ]);

            if (oppsResponse.error) throw oppsResponse.error;
            if (prodsResponse.error) throw prodsResponse.error;
            if (custsResponse.error) throw custsResponse.error;

            setData({
                opportunities: oppsResponse.data || [],
                products: prodsResponse.data || [],
                customers: custsResponse.data || [],
                hasPendingTasks: data.hasPendingTasks
            });
            await checkForPendingTasks();

        } catch (error) {
            console.error("Error fetching all data:", error);
            toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, data.hasPendingTasks, checkForPendingTasks]);
    
    useEffect(() => {
        fetchData();
    }, [user, syncKey]);

    useEffect(() => {
        const aggregated = aggregatePerformanceData(data.opportunities, selectedMonthFilter);
        setPerformanceData(aggregated);
    }, [selectedMonthFilter, data.opportunities]);

    return {
        ...data,
        loading,
        performanceData,
        selectedMonthFilter,
        setSelectedMonthFilter,
        handleDataRefreshNeeded: triggerSync,
    };
};