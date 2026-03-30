import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useLocalization } from '@/contexts/LocalizationContext';

const FutureProjectionsChart = ({ data, isMobile }) => {
    const { formatMoney } = useLocalization();

    if (!data || data.length === 0) {
        return (
            <Card className="h-full border-white/10 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Projeção Financeira (6 Meses)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">Sem dados suficientes para projeção.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-white/10 bg-black/20 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Projeção Financeira (6 Meses)</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                        <XAxis 
                            dataKey="label" 
                            stroke="#9ca3af" 
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            stroke="#9ca3af" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => isMobile ? '' : formatMoney(value)}
                        />
                        <Tooltip
                            formatter={(value) => formatMoney(value)}
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            labelStyle={{ color: '#9ca3af' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        {/* <Line type="monotone" dataKey="accumulated_boletos" name="Acumulado Boletos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} /> */}
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default FutureProjectionsChart;