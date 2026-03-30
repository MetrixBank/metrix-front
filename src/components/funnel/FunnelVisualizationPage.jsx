import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useFunnelMetrics } from '@/hooks/useFunnelMetrics';
import { Loader2 } from 'lucide-react';

const FunnelVisualizationPage = () => {
    const { metrics, loading } = useFunnelMetrics('30d');

    if (loading) return (
        <div className="flex items-center justify-center h-64">
             <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    if (!metrics || !metrics.stage_distribution || Object.keys(metrics.stage_distribution).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                 <p>Sem dados suficientes para visualização.</p>
            </div>
        );
    }

    const funnelData = Object.entries(metrics.stage_distribution).map(([stage, count]) => ({
        name: stage,
        count: count,
        fill: '#8b5cf6'
    })).sort((a,b) => b.count - a.count);

    // Simple default colors for pie chart if no specific temp data available
    const tempDistribution = [
        { name: 'Quente', value: 30, color: '#ef4444' }, 
        { name: 'Morno', value: 45, color: '#f97316' },
        { name: 'Frio', value: 25, color: '#3b82f6' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {/* Main Funnel Chart */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-white">Funil de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" stroke="#64748b" />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Taxa de Conversão Global</h3>
                        <div className="text-4xl font-bold text-white mb-1">{metrics.conversion_rate}%</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Tempo Médio de Ciclo</h3>
                        <div className="text-4xl font-bold text-white mb-1">{metrics.avg_time_in_stage}</div>
                        <div className="text-slate-500 text-xs font-medium">dias</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                         <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Valor em Pipeline</h3>
                         <div className="text-3xl font-bold text-indigo-400 mb-1">R$ {metrics.potential_value.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for temperature chart until we have aggregated data endpoint */}
            <Card className="bg-slate-900 border-slate-800 opacity-50 pointer-events-none grayscale">
                <CardHeader>
                    <CardTitle className="text-white text-base">Temperatura dos Leads (Em Breve)</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                     <p className="text-xs text-slate-500">Visualização disponível em breve</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default FunnelVisualizationPage;