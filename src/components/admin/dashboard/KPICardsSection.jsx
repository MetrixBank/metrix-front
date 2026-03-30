import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, DollarSign, Activity, CheckCircle, Award, Coins, Users, Percent, BarChart } from 'lucide-react';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const KpiCard = ({ title, value, trend, change, icon: Icon, loading, formatFn = (v) => v }) => {
    if (loading) return <Skeleton className="h-32 w-full rounded-xl bg-slate-800/50" />;

    const isPositive = trend > 0;
    const isNeutral = trend === 0;
    
    let TrendIcon = isPositive ? TrendingUp : (isNeutral ? Minus : TrendingDown);
    let trendColor = isPositive ? 'text-emerald-400' : (isNeutral ? 'text-slate-400' : 'text-rose-400');
    let trendBg = isPositive ? 'bg-emerald-500/10' : (isNeutral ? 'bg-slate-500/10' : 'bg-rose-500/10');

    return (
        <Card className="bg-[#1e293b]/40 backdrop-blur border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-400">{title}</p>
                        <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">{formatFn(value)}</h3>
                    </div>
                    <div className={`p-2 rounded-lg bg-slate-800/50 text-slate-300`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${trendColor} ${trendBg}`}>
                        <TrendIcon className="w-3 h-3" />
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                    <span className="text-xs text-slate-500">vs. período anterior</span>
                </div>
            </CardContent>
        </Card>
    );
};

const KPICardsSection = ({ kpis, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
                title="Receita Total" 
                value={kpis.totalRevenue.value} 
                trend={kpis.totalRevenue.trend} 
                icon={DollarSign} 
                loading={loading}
                formatFn={formatCurrency}
            />
            <KpiCard 
                title="Atividades" 
                value={kpis.activitiesCount.value} 
                trend={kpis.activitiesCount.trend} 
                icon={Activity} 
                loading={loading}
            />
            <KpiCard 
                title="Vendas Concluídas" 
                value={kpis.completedSales.value} 
                trend={kpis.completedSales.trend} 
                icon={CheckCircle} 
                loading={loading}
            />
            <KpiCard 
                title="Pontos Gerados" 
                value={kpis.pointsGenerated.value} 
                trend={kpis.pointsGenerated.trend} 
                icon={Award} 
                loading={loading}
                formatFn={(v) => formatNumberWithSuffix(v)}
            />
            <KpiCard 
                title="Tokens em Circulação" 
                value={kpis.tokensInCirculation.value} 
                trend={kpis.tokensInCirculation.trend} 
                icon={Coins} 
                loading={loading}
                formatFn={(v) => formatNumberWithSuffix(v)}
            />
            <KpiCard 
                title="Receita Média / Dist." 
                value={kpis.avgRevenuePerDistributor.value} 
                trend={kpis.avgRevenuePerDistributor.trend} 
                icon={Users} 
                loading={loading}
                formatFn={formatCurrency}
            />
            <KpiCard 
                title="Taxa de Conversão" 
                value={kpis.conversionRate.value} 
                trend={kpis.conversionRate.trend} 
                icon={Percent} 
                loading={loading}
                formatFn={(v) => v.toFixed(1) + '%'}
            />
            <KpiCard 
                title="Crescimento MoM" 
                value={kpis.momGrowth.value} 
                trend={kpis.momGrowth.trend} 
                icon={BarChart} 
                loading={loading}
                formatFn={(v) => v.toFixed(1) + '%'}
            />
        </div>
    );
};

export default KPICardsSection;