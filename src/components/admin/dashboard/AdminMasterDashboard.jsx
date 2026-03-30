import React, { useState } from 'react';
import { subDays } from 'date-fns';
import AdminMasterDashboardHeader from './AdminMasterDashboardHeader';
import KPICardsSection from './KPICardsSection';
import RevenueOverTimeChart from './RevenueOverTimeChart';
import ProductionByTeamChart from './ProductionByTeamChart';
import DistributorRankingTable from './DistributorRankingTable';
import ActivityFunnelChart from './ActivityFunnelChart';
import FutureRevenueProjectionChart from './FutureRevenueProjectionChart';
import { useAdminMasterDashboardData } from '@/hooks/useAdminMasterDashboardData';

const AdminMasterDashboard = () => {
    // Default to last 30 days
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    
    // Key used to force refresh
    const [refreshKey, setRefreshKey] = useState(0);

    const { kpis, charts, loading, error } = useAdminMasterDashboardData({ 
        ...dateRange, 
        refreshKey 
    });

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl m-4">
                <h3 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar dashboard</h3>
                <p className="text-slate-300">{error.message}</p>
                <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Tentar Novamente</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <AdminMasterDashboardHeader 
                dateRange={dateRange} 
                setDateRange={setDateRange} 
                onRefresh={handleRefresh}
                loading={loading}
            />

            <KPICardsSection kpis={kpis} loading={loading} />

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueOverTimeChart data={charts.revenueOverTime} loading={loading} />
                </div>
                <div>
                    <ProductionByTeamChart data={charts.productionByTeam} loading={loading} />
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <ActivityFunnelChart data={charts.activityFunnel} loading={loading} />
                </div>
                <div>
                    <FutureRevenueProjectionChart data={charts.futureProjection} loading={loading} />
                </div>
                 {/* Ranking Table takes remaining space or full width in a different layout flow, here usually fits well below or side */}
                 {/* Since we have 2 cols here, let's put ranking in its own row below for full width detail */}
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1">
                 <DistributorRankingTable data={charts.distributorRanking} loading={loading} />
            </div>
        </div>
    );
};

export default AdminMasterDashboard;