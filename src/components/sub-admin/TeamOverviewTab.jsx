import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Filter, BarChart3, Package } from 'lucide-react';
import LazyLoadWrapper from '@/components/admin/overview/LazyLoadWrapper';
import OpportunityFilters from '@/components/admin/overview/OpportunityFilters';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import OpportunityStats from '@/components/admin/overview/OpportunityStats';
import OpportunityCharts from '@/components/admin/overview/OpportunityCharts';
import TeamStockSummary from '@/components/admin/overview/TeamStockSummary';
import DistributorStockList from '@/components/admin/overview/DistributorStockList';
import SalesAIInsights from '@/components/admin/overview/SalesAIInsights';
import SalesFunnelChart from '@/components/management/overview/SalesFunnelChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocalization } from '@/contexts/LocalizationContext';

const TeamOverviewTab = ({ teamData, loading, error, refetch, dateFilter }) => {
    const { region } = useLocalization();
    // Use dateFilter props for time selection instead of local state for presets
    // We still keep local state for secondary filters like Distributor/Status
    const [filters, setFilters] = useState({
        distributorId: 'all',
        customerSearch: '',
        activityStatus: 'all',
        consultantName: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // Currency & Region Logic
    const isUSA = region === 'USA';
    const TOKEN_TO_CURRENCY_RATE = isUSA ? 1000 : 5000; 
    const POINTS_DIVISOR = isUSA ? 1000.0 : 4000.0;
    
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredData = useMemo(() => {
        if (!teamData?.opportunities) return { opportunities: [], opportunityProducts: [], distributors: [], products: [] };
        
        let opportunities = [...teamData.opportunities];
        let products = [...teamData.products];
        
        // Apply Date Filters from Props
        if (dateFilter?.startDate) {
            const startDate = new Date(dateFilter.startDate);
            opportunities = opportunities.filter(op => op.visit_date && new Date(op.visit_date) >= startDate);
        }
        if (dateFilter?.endDate) {
            const endDate = new Date(dateFilter.endDate);
            opportunities = opportunities.filter(op => op.visit_date && new Date(op.visit_date) <= endDate);
        }

        // Apply Local Secondary Filters
        if (filters.distributorId && filters.distributorId !== 'all') {
            opportunities = opportunities.filter(op => op.distributor_id === filters.distributorId);
            products = products.filter(p => p.distributor_id === filters.distributorId);
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
        }
        
        const opportunityIds = new Set(opportunities.map(op => op.id));
        const opportunityProducts = (opportunities.flatMap(op => op.opportunity_products || []))
            .filter(p => p && p.opportunity_id && opportunityIds.has(p.opportunity_id))
            .map(p => ({
                ...p,
                product: teamData.products.find(prod => prod.id === p.product_id)
            }));
        
        return { opportunities, opportunityProducts, distributors: teamData.distributors, products };
    }, [teamData, filters, dateFilter]); // Added dateFilter as dependency

    const memoizedStats = useMemo(() => {
        if (!teamData?.distributors) return { adminStats: {}, opportunityStats: {} };
    
        const { distributors } = teamData;
        const { opportunities: filteredOpportunities, opportunityProducts: filteredOpportunityProducts } = filteredData;
    
        const totalActiveMembers = distributors.length;
        const totalTeamTokens = distributors.reduce((sum, dist) => sum + (dist.tokens || 0), 0);
        
        const filteredSalesOpportunities = filteredOpportunities.filter(op => op.status === 'sale_made');
        const totalPointsFromFilteredSales = filteredOpportunityProducts
            .filter(item => {
                const opp = filteredOpportunities.find(o => o.id === item.opportunity_id);
                return opp && opp.status === 'sale_made';
            })
            .reduce((sum, item) => sum + ((item.unit_cost_price_at_sale || 0) * (item.quantity_sold || 0)), 0) / POINTS_DIVISOR;

        const adminStats = {
            totalDistributors: totalActiveMembers,
            totalTeamTokens: totalTeamTokens,
            tokenValue: totalTeamTokens * TOKEN_TO_CURRENCY_RATE,
            totalTeamPoints: totalPointsFromFilteredSales,
        };
    
        const opportunityStats = (() => {
            const totalVisits = filteredOpportunities.length;
            const totalSalesMade = filteredSalesOpportunities.length;
            const totalSaleValue = filteredSalesOpportunities.reduce((sum, op) => sum + (op.sale_value || 0), 0);
            const totalProductsSoldUnits = filteredOpportunityProducts.reduce((sum, item) => sum + (item.quantity_sold || 0), 0);
            const conversionRate = totalVisits > 0 ? (totalSalesMade / totalVisits) * 100 : 0;
            const averageTicket = totalSalesMade > 0 ? totalSaleValue / totalSalesMade : 0;
            return { totalVisits, totalSalesMade, totalSaleValue, totalProductsSoldUnits, conversionRate, averageTicket, totalPointsGenerated: totalPointsFromFilteredSales };
        })();
    
        return { adminStats, opportunityStats };
    }, [teamData, filteredData, TOKEN_TO_CURRENCY_RATE, POINTS_DIVISOR]);
    
    
    const normalizeProductName = (name) => {
        if (!name) return 'Desconhecido';
        return name.replace(/\s*(110v|220v|bivolt| bivolt)\s*$/i, '').trim();
    };
    
    const memoizedCharts = useMemo(() => {
        if (!teamData?.opportunities) return {};
        const { opportunities, opportunityProducts } = filteredData;
    
        const salesOpportunities = opportunities.filter(op => op.status === 'sale_made');
    
        const salesOverTimeData = Object.entries(salesOpportunities.reduce((acc, op) => {
            if (!op.visit_date) return acc;
            const date = new Date(op.visit_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            acc[date] = (acc[date] || 0) + (op.sale_value || 0);
            return acc;
        }, {})).map(([name, total]) => ({ name, total })).sort((a, b) => {
            const [dayA, monthA] = a.name.split('/');
            const [dayB, monthB] = b.name.split('/');
            return new Date(`2000-${monthA}-${dayA}`) - new Date(`2000-${monthB}-${dayB}`);
        });

        const topDistributorsBySalesData = Object.entries(salesOpportunities.reduce((acc, op) => {
            const dist = teamData.distributors.find(d => d.id === op.distributor_id);
            const distName = dist?.name || 'Desconhecido';
            const saleValue = op.sale_value || 0;
            const netProfit = op.net_profit_calculated || 0;
            if (!acc[distName]) acc[distName] = { total: 0, profit: 0 };
            acc[distName].total += saleValue;
            acc[distName].profit += netProfit;
            return acc;
        }, {})).map(([name, values]) => ({ name, ...values })).sort((a, b) => b.total - a.total).slice(0, 10);
    
        const topProductsData = Object.entries(opportunityProducts.reduce((acc, item) => {
            const productName = normalizeProductName(item.product?.name);
            acc[productName] = (acc[productName] || 0) + (item.quantity_sold || 0);
            return acc;
        }, {})).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

        const activityStatusMap = {
            'scheduled': 'Agendada',
            'in_progress': 'Em Progresso',
            'visit_made': 'Concluída (S/ Venda)',
            'sale_made': 'Venda Realizada',
            'postponed': 'Adiada',
            'cancelled': 'Cancelada'
        };

        const activityStatusData = Object.entries(opportunities.reduce((acc, op) => {
            const statusName = activityStatusMap[op.status] || op.status;
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
        }, {})).map(([name, value]) => ({ name, value }));
        
        return { salesOverTimeData, topDistributorsBySalesData, topProductsData, activityStatusData };
    }, [teamData, filteredData]);
    

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

    const distributorsForSelect = useMemo(() => {
        return teamData?.distributors || [];
    }, [teamData]);

    const consultants = useMemo(() => {
        if (!teamData) return [];
        return Array.from(new Set((teamData.opportunities || []).map(op => op.consultant_name).filter(Boolean))).map(name => ({ name, id: name }));
    }, [teamData]);

    if (error) {
        return <div className="text-center text-destructive">Erro ao carregar dados da equipe.</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-primary" />
                        Visão Geral da Equipe {isUSA && '(USA Region)'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o desempenho, vendas e metas do seu time em tempo real.
                    </p>
                    {dateFilter && (
                         <p className="text-xs text-emerald-400 font-medium mt-1">
                            Período: {dateFilter.label}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={showFilters ? "secondary" : "outline"} 
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filtros Avançados
                    </Button>
                </div>
            </div>

            <motion.div 
                initial={false}
                animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
                className="overflow-hidden"
            >
                <div className="bg-card/40 border border-border/40 rounded-lg p-4 shadow-sm mb-4">
                     <OpportunityFilters
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        distributors={distributorsForSelect || []}
                        consultants={consultants}
                        fetchData={refetch}
                        loading={loading}
                        showCustomerSearch={true}
                        showActivityStatus={true}
                        showConsultantFilter={true}
                        showDistributorTypeFilter={false}
                    />
                </div>
            </motion.div>

            <Separator className="bg-border/30" />

            <section>
                 <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" /> 
                    Indicadores Chave
                </h2>
                <LazyLoadWrapper placeholderHeight="120px">
                    <AdminStatsCards stats={memoizedStats.adminStats} />
                </LazyLoadWrapper>

                <div className="mt-6">
                    <LazyLoadWrapper placeholderHeight="180px">
                        <OpportunityStats stats={memoizedStats.opportunityStats} opportunityCount={filteredData.opportunities.length} />
                    </LazyLoadWrapper>
                </div>
            </section>
            
            <section className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                <div className="xl:col-span-3 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                         <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" /> 
                            Análise de Vendas
                        </h2>
                    </div>
                    <LazyLoadWrapper>
                        <OpportunityCharts {...memoizedCharts} opportunityCount={filteredData.opportunities.length} />
                    </LazyLoadWrapper>
                </div>
                
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                         <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-500" /> 
                            Funil de Conversão
                        </h2>
                    </div>
                    <LazyLoadWrapper>
                        <Card className="card-gradient shadow-lg border-border/30 h-full min-h-[450px]">
                            <CardHeader>
                                <CardTitle className="text-md text-gradient">Etapas do Processo</CardTitle>
                                <CardDescription>Visualização do fluxo de vendas da equipe</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <SalesFunnelChart data={funnelData} />
                            </CardContent>
                        </Card>
                    </LazyLoadWrapper>
                </div>
            </section>
            
            <section>
                <LazyLoadWrapper>
                    <SalesAIInsights data={teamData} filteredData={filteredData} />
                </LazyLoadWrapper>
            </section>
            
            <section className="space-y-6">
                 <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-500" /> 
                    Gestão de Estoque
                </h2>
                
                <LazyLoadWrapper>
                    <TeamStockSummary 
                        products={teamData?.products || []} 
                        distributors={teamData?.distributors || []} 
                        title="Visão Geral do Estoque" 
                    />
                </LazyLoadWrapper>

                <LazyLoadWrapper>
                    <DistributorStockList 
                        products={teamData?.products || []} 
                        distributors={teamData?.distributors || []} 
                    />
                </LazyLoadWrapper>
            </section>

        </motion.div>
    );
};

export default TeamOverviewTab;