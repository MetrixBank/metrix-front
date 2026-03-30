import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const SubAdminTeamFutureProjection = ({ data, loading }) => {
    if (loading) return <Skeleton className="h-[400px] w-full rounded-xl bg-slate-800/50" />;

    return (
        <Card className="bg-[#1e293b]/40 border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg text-white font-semibold">Projeção de Receita (Equipe)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[320px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                            <CartesianGrid stroke="#f5f5f5" strokeOpacity={0.1} vertical={false} />
                            <XAxis dataKey="name" scale="band" stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                formatter={(val) => formatCurrency(val)}
                            />
                            <Legend />
                            <Bar dataKey="actual" name="Realizado" barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="projected" name="Projeção" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default SubAdminTeamFutureProjection;