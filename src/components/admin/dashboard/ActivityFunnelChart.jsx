import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityFunnelChart = ({ data, loading }) => {
    if (loading) return <Skeleton className="h-[400px] w-full rounded-xl bg-slate-800/50" />;

    return (
        <Card className="bg-[#1e293b]/40 border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-white font-semibold">Funil de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Funnel
                                    dataKey="value"
                                    data={data}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
                                    {data.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Sem dados de funil.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ActivityFunnelChart;