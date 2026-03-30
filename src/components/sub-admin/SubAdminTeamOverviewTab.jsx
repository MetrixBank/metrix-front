import React from 'react';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import SubAdminTeamRevenueChart from './SubAdminTeamRevenueChart';
import SubAdminTeamProductionChart from './SubAdminTeamProductionChart';
import SubAdminTeamDistributorRanking from './SubAdminTeamDistributorRanking';
import SubAdminTeamActivityFunnel from './SubAdminTeamActivityFunnel';
import SubAdminTeamFutureProjection from './SubAdminTeamFutureProjection';
import useSubAdminTeamData from '@/hooks/useSubAdminTeamData';
import { useAuth } from '@/hooks/useAuth';

const SubAdminTeamOverviewTab = () => {
    const { user } = useAuth();
    const { data, loading, error } = useSubAdminTeamData(user?.id);

    if (error) {
         return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-xl m-4">
                <h3 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar dados da equipe</h3>
                <p className="text-slate-300">{error.message}</p>
            </div>
        );
    }

    const stats = {
        totalDistributors: data.kpis.activeDistributors,
        totalTeamPoints: data.kpis.totalPoints,
        totalTeamTokens: data.kpis.totalTeamTokens,
        tokenValue: data.kpis.tokenValue
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            {/* KPI Cards Reused from Admin */}
            <AdminStatsCards stats={stats} />

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SubAdminTeamRevenueChart data={data.charts.revenueOverTime} loading={loading} />
                </div>
                <div>
                    <SubAdminTeamProductionChart data={data.charts.productionByTeam} loading={loading} />
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <SubAdminTeamActivityFunnel data={data.charts.activityFunnel} loading={loading} />
                </div>
                <div>
                    <SubAdminTeamFutureProjection data={data.charts.futureProjection} loading={loading} />
                </div>
                <div className="lg:col-span-1">
                     {/* Space for future widget or notes */}
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1">
                 <SubAdminTeamDistributorRanking data={data.charts.distributorRanking} loading={loading} />
            </div>
        </div>
    );
};

export default SubAdminTeamOverviewTab;