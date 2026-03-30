import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProductionByTeamChart = ({ data, loading }) => {
    if (loading) return <Skeleton className="h-[400px] w-full rounded-xl bg-slate-800/50" />;

    // Custom Tooltip to show avatar
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                         <Avatar className="h-6 w-6">
                            <AvatarImage src={d.avatar} />
                            <AvatarFallback>{d.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-white font-medium">{d.name}</span>
                    </div>
                    <p className="text-emerald-400 font-bold">{formatCurrency(d.value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-[#1e293b]/40 border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-white font-semibold">Top 10 Produção (Equipe)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#f59e0b' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="h-full flex items-center justify-center text-slate-500">
                            Sem dados de produção.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductionByTeamChart;