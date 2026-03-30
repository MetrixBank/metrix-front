import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Filter } from 'lucide-react';
import useAdminOverviewData from './hooks/useAdminOverviewData';
import LazyLoadWrapper from './LazyLoadWrapper';
import { useAuth } from '@/contexts/SupabaseAuthContext';

import OpportunityFilters from './OpportunityFilters';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import OpportunityStats from './OpportunityStats';
import OpportunityCharts from './OpportunityCharts';
import TeamStockSummary from './TeamStockSummary';
import DistributorStockList from './DistributorStockList';
import SalesAIInsights from './SalesAIInsights';
import SalesFunnelChart from '@/components/management/overview/SalesFunnelChart';
import PlatformCharts from './PlatformCharts';
import SalesDistributionMap from './SalesDistributionMap';
import AllActivitiesList from './AllActivitiesList';
import AllCustomersList from './AllCustomersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataSync } from '@/contexts/DataSyncContext';

const AdminOverviewDashboard = ({ user, distributorType }) => {
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        distributorId: 'all',
        customerSearch: '',
        activityStatus: 'all',
        consultantName: 'all',
        distributorType: distributorType,
    });
    const { syncKey } = useDataSync();
    
    // Currency Handling for USA
    const isUSA = user?.region === 'USA';
    const TOKEN_TO_BRL_RATE = 5000;
    const USD_TO_BRL_RATE = 5.0; // This is an approximation for normalization, UI displays should use formatCurrencyUSD for US users

    useEffect(() => {
        setFilters(prev => ({ ...prev, distributorType: distributorType, distributorId: 'all' }));
    }, [distributorType]);

    const { data, loading, error, refetch, allDistributorsForFilter } = useAdminOverviewData();

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    useEffect(() => {
        refetch();
    }, [syncKey, refetch]);

    const getSafeDateString = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0]; 
    };

    const filteredData = useMemo(() => {
        if (!data) return { opportunities: [], customers: [], opportunityProducts: [], distributors: [], products: [] };
        
        let opportunities = [...data.opportunities];
        let products = [...data.products];
        let distributors = [...data.distributors];
        let customers = [...data.customers];
        
        if (filters.startDate) {
            opportunities = opportunities.filter(op => getSafeDateString(op.visit_date) >= filters.startDate);
        }
        if (filters.endDate) {
            opportunities = opportunities.filter(op => getSafeDateString(op.visit_date) <= filters.endDate);
        }

        if (filters.distributorId && filters.distributorId !== 'all') {
            opportunities = opportunities.filter(op => op.distributor_id === filters.distributorId);
            products = products.filter(p => p.distributor_id === filters.distributorId);
            customers = customers.filter(c => c.distributor_id === filters.distributorId);
        }
         if (distributorType && distributorType !== 'all') {
            opportunities = opportunities.filter(op => op.distributor?.distributor_type === distributorType);
            products = products.filter(p => p.distributor?.distributor_type === distributorType);
            distributors = distributors.filter(d => d.distributor_type === distributorType);
            customers = customers.filter(c => c.distributor?.distributor_type === distributorType);
        }

        if (filters.consultantName && filters.consultantName !== 'all') {
            opportunities = opportunities.filter(op => op.consultant_name === filters.consultantName);
        }
        if (filters.activityStatus && filters.activityStatus !== 'all') {
            opportunities = opportunities.filter(op => op.status === filters.activityStatus);
        }
        if (filters.customerSearch) {
            const search = filters.customerSearch.toLowerCase();
            opportunities = opportunities.filter(op => op.customer_name?.toLowerCase().includes(search));
            customers = customers.filter(c => c.name?.toLowerCase().includes(search));
        }
        
        opportunities.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

        const opportunityIds = new Set(opportunities.map(op => op.id));
        const opportunityProducts = (opportunities.flatMap(op => op.opportunity_products || []))
            .filter(p => p && p.opportunity_id && opportunityIds.has(p.opportunity_id));
        
        return { opportunities, opportunityProducts, distributors, products, customers };
    }, [data, filters, distributorType]);


    const memoizedStats = useMemo(() => {
        if (!data) return { adminStats: {}, opportunityStats: {} };

        const { distributors: filteredDistributors, opportunities: filteredOpportunities } = filteredData;
       
        const allSalesOpportunities = filteredOpportunities.filter(op => op.status === 'sale_made');
        
        const totalTeamPoints = allSalesOpportunities.reduce((sum, sale) => {
             const dist = data.distributors.find(d => d.id === sale.distributor_id);
             // Use dynamic divisor based on distributor region
             const distIsUSA = dist?.region === 'USA';
             const currentDivisor = distIsUSA ? 1000.0 : 4000.0;

            const saleCost = (sale.opportunity_products || []).reduce((productSum, item) => 
                productSum + ((item.unit_cost_price_at_sale || 0) * (item.quantity_sold || 0)), 0);
            
            return sum + (saleCost / currentDivisor);
        }, 0);

        const adminStats = {
            totalDistributors: filteredDistributors.length,
            totalTeamTokens: filteredDistributors.reduce((sum, dist) => sum + (dist.tokens || 0), 0),
            tokenValue: filteredDistributors.reduce((sum, dist) => sum + (dist.tokens || 0), 0) * TOKEN_TO_BRL_RATE,
            totalTeamPoints: totalTeamPoints,
        };
        
        const filteredSalesOpportunities = filteredOpportunities.filter(op => op.status === 'sale_made');
        const filteredSalesOpportunityIds = new Set(filteredSalesOpportunities.map(op => op.id));
        const filteredSalesOpportunityProducts = (filteredOpportunities.flatMap(op => op.opportunity_products || []))
            .filter(p => p && p.opportunity_id && filteredSalesOpportunityIds.has(p.opportunity_id));

        const opportunityStats = (() => {
            const totalVisits = filteredOpportunities.length;
            const totalSalesMade = filteredSalesOpportunities.length;
            
            // Sum sales based on raw values. Normalization happens if needed for aggregate comparison
            const totalSaleValue = filteredSalesOpportunities.reduce((sum, op) => {
                // If viewing a US dashboard, assume all sales are USD or convert BRL to USD for display if mixed
                // For simplicity here, we sum raw values assuming single currency view or separate dashboards
                return sum + (op.sale_value || 0);
            }, 0);

            const totalProductsSoldUnits = filteredSalesOpportunityProducts.reduce((sum, item) => sum + (item.quantity_sold || 0), 0);
            const conversionRate = totalVisits > 0 ? (totalSalesMade / totalVisits) * 100 : 0;
            const averageTicket = totalSalesMade > 0 ? totalSaleValue / totalSalesMade : 0;
            
            return { totalVisits, totalSalesMade, totalSaleValue, totalProductsSoldUnits, conversionRate, averageTicket, totalPointsGenerated: totalTeamPoints };
        })();

        return { adminStats, opportunityStats };
    }, [data, filteredData, TOKEN_TO_BRL_RATE]);
    
    const normalizeProductName = (name) => {
        if (!name) return 'Desconhecido';
        return name.replace(/\s*(110v|220v|bivolt| bivolt)\s*$/i, '').trim();
    };

    const memoizedCharts = useMemo(() => {
        if (!data) return {};
        const { opportunities } = filteredData;

        const salesOpportunities = opportunities.filter(op => op.status === 'sale_made');
        const salesOpportunityIds = new Set(salesOpportunities.map(op => op.id));
        const salesOpportunityProducts = (opportunities.flatMap(op => op.opportunity_products || []))
            .filter(p => p && p.opportunity_id && salesOpportunityIds.has(p.opportunity_id));
       
        const salesOverTimeData = Object.entries(salesOpportunities.reduce((acc, op) => {
            const date = new Date(op.visit_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            // Sum raw value
            const value = (op.sale_value || 0);
            acc[date] = (acc[date] || 0) + value;
            return acc;
        }, {})).map(([name, total]) => ({ name, total })).sort((a, b) => new Date(a.name.split('/').reverse().join('-')) - new Date(b.name.split('/').reverse().join('-')));

        const topDistributorsBySalesData = Object.entries(salesOpportunities.reduce((acc, op) => {
            const distName = op.distributor?.name || 'Desconhecido';
            const saleValue = (op.sale_value || 0);
            const netProfit = (op.net_profit_calculated || 0);
            if (!acc[distName]) acc[distName] = { total: 0, profit: 0 };
            acc[distName].total += saleValue;
            acc[distName].profit += netProfit;
            return acc;
        }, {})).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.total - a.total).slice(0, 10);

        const topProductsData = Object.entries(salesOpportunityProducts.reduce((acc, item) => {
            const productName = normalizeProductName(item.product?.name);
            acc[productName] = (acc[productName] || 0) + (item.quantity_sold || 0);
            return acc;
        }, {})).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

        const activityStatusData = Object.entries(opportunities.reduce((acc, op) => {
            const statusMap = { 'scheduled': 'Agendada', 'in_progress': 'Em Progresso', 'visit_made': 'Concluída (S/ Venda)', 'sale_made': 'Venda Realizada', 'postponed': 'Adiada', 'cancelled': 'Cancelada' };
            const statusName = statusMap[op.status] || op.status;
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
        }, {})).map(([name, value]) => ({ name, value }));
        
        const totalRevenueChartData = salesOverTimeData; 
        const topDistributorsByTokensChartData = filteredData.distributors
            .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
            .slice(0, 5)
            .map(d => ({ name: d.name, value: d.tokens || 0 }));
            
        const newUsersChartData = [];

        const salesByState = salesOpportunities.reduce((acc, op) => {
             const dist = data.distributors.find(d => d.id === op.distributor_id);
             const state = dist?.address_state || 'SP';
             if (!acc[state]) acc[state] = [];
             acc[state].push(op);
             return acc;
        }, {});

        return { salesOverTimeData, topDistributorsBySalesData, topProductsData, activityStatusData, totalRevenueChartData, topDistributorsByTokensChartData, newUsersChartData, salesByState };
    }, [data, filteredData]);

    const funnelData = useMemo(() => {
        const { opportunities } = filteredData;
        if (!opportunities) return [];

        const totalActivities = opportunities.length;
        const scheduled = opportunities.filter(op => op.status === 'scheduled').length;
        const inProgress = opportunities.filter(op => op.status === 'in_progress').length;
        const visitMade = opportunities.filter(op => op.status === 'visit_made').length;
        const saleMade = opportunities.filter(op => op.status === 'sale_made').length;
        const cancelled = opportunities.filter(op => op.status === 'cancelled').length;
        const postponed = opportunities.filter(op => op.status === 'postponed').length;

        return [
            { name: 'Total de Atividades', value: totalActivities, fill: 'url(#gradientTotal)' },
            { name: 'Agendadas', value: scheduled, fill: 'url(#gradientScheduled)' },
            { name: 'Em Progresso', value: inProgress, fill: 'url(#gradientInProgress)' },
            { name: 'Concluídas s/ Venda', value: visitMade, fill: 'url(#gradientCompletedNoSale)' },
            { name: 'Vendas Realizadas', value: saleMade, fill: 'url(#gradientSaleMade)' },
            { name: 'Canceladas', value: cancelled, fill: 'url(#gradientCancelled)' },
            { name: 'Adiadas', value: postponed, fill: 'url(#gradientPostponed)' },
        ].filter(d => d.value > 0);
    }, [filteredData]);

    const consultants = useMemo(() => {
        if (!data) return [];
        return Array.from(new Set((data.opportunities || []).map(op => op.consultant_name).filter(Boolean))).map(name => ({ name, id: name }));
    }, [data]);

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-destructive">Erro ao carregar dados.</div>;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <OpportunityFilters
                filters={filters}
                handleFilterChange={handleFilterChange}
                distributors={allDistributorsForFilter || []}
                consultants={consultants}
                fetchData={refetch}
                loading={loading}
                showCustomerSearch={true}
                showActivityStatus={true}
                showConsultantFilter={true}
                showDistributorTypeFilter={true} 
            />

            {/* Primary Sales Stats */}
            <LazyLoadWrapper placeholderHeight="180px">
                <OpportunityStats stats={memoizedStats.opportunityStats} opportunityCount={filteredData.opportunities.length} />
            </LazyLoadWrapper>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <LazyLoadWrapper>
                        <OpportunityCharts {...memoizedCharts} opportunityCount={filteredData.opportunities.length} />
                    </LazyLoadWrapper>
                </div>
                <div className="lg:col-span-2">
                    <LazyLoadWrapper>
                        <Card className="card-gradient shadow-lg border-border/30 h-full">
                            <CardHeader>
                                <CardTitle className="text-md text-gradient flex items-center">
                                    <Filter className="w-4 h-4 mr-2"/>Funil de Vendas Detalhado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <SalesFunnelChart data={funnelData} />
                            </CardContent>
                        </Card>
                    </LazyLoadWrapper>
                </div>
            </div>

            {/* Secondary Platform Stats */}
            <LazyLoadWrapper placeholderHeight="120px">
                <AdminStatsCards stats={memoizedStats.adminStats} />
            </LazyLoadWrapper>
            
            <LazyLoadWrapper>
                <PlatformCharts 
                    totalRevenueChartData={memoizedCharts.totalRevenueChartData} 
                    topDistributorsByTokensChartData={memoizedCharts.topDistributorsByTokensChartData} 
                    newUsersChartData={memoizedCharts.newUsersChartData} 
                />
            </LazyLoadWrapper>
            
            <LazyLoadWrapper>
                <SalesDistributionMap salesByState={memoizedCharts.salesByState} />
            </LazyLoadWrapper>
            
            <LazyLoadWrapper>
                <SalesAIInsights data={data} filteredData={filteredData} />
            </LazyLoadWrapper>
            
            <LazyLoadWrapper>
                <TeamStockSummary products={filteredData.products || []} distributors={filteredData.distributors || []} />
            </LazyLoadWrapper>

            <LazyLoadWrapper>
                <DistributorStockList products={filteredData.products || []} distributors={filteredData.distributors || []} />
            </LazyLoadWrapper>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <LazyLoadWrapper>
                    <AllActivitiesList activities={filteredData.opportunities} products={filteredData.products} />
                </LazyLoadWrapper>
                <LazyLoadWrapper>
                     <AllCustomersList customers={filteredData.customers} />
                </LazyLoadWrapper>
            </div>

        </motion.div>
    );
};

export default AdminOverviewDashboard;