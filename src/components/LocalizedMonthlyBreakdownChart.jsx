import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const LocalizedMonthlyBreakdownChart = ({ data, isMobile }) => {
    const { formatMoney } = useLocalization();

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border p-2 rounded shadow-lg text-xs">
                    <p className="font-semibold">{payload[0].name}</p>
                    <p className="text-primary">{formatMoney(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="card-gradient border border-border/50 lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Distribuição de Despesas</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                 {data?.expense?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.expense}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={isMobile ? 60 : 80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.expense.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sem dados de despesas este mês.
                    </div>
                 )}
            </CardContent>
        </Card>
    );
};

export default LocalizedMonthlyBreakdownChart;