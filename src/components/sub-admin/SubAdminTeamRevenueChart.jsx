import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const SubAdminTeamRevenueChart = ({ data, loading }) => {
    if (loading) return <Skeleton className="h-[400px] w-full rounded-xl bg-slate-800/50" />;

    return (
        <Card className="bg-[#1e293b]/40 border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-white font-semibold">Evolução da Receita (Equipe)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenueGraph" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#64748b" 
                                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#64748b" 
                                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(val) => `R$${val / 1000}k`} 
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#10b981' }}
                                    formatter={(val) => formatCurrency(val)}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    name="Receita" 
                                    stroke="#10b981" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenueGraph)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Sem dados de receita para a equipe.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default SubAdminTeamRevenueChart;