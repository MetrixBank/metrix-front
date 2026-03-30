import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const MonthlyBreakdownChart = ({ data, isMobile }) => {
    const { formatMoney } = useLocalization();
    const [activeTab, setActiveTab] = useState('expense');

    // Ensure data exists and has at least one item with value > 0
    const chartData = data?.[activeTab] || [];
    const hasData = chartData.length > 0 && chartData.some(item => item.value > 0);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
        return percent > 0.05 ? (
          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        ) : null;
    };

    return (
        <Card className="h-full border-white/10 bg-black/20 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg font-medium leading-tight">Composição do Mês</CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[160px] sm:w-[180px] shrink-0">
                        <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/20">
                            <TabsTrigger value="income" className="text-xs">Receitas</TabsTrigger>
                            <TabsTrigger value="expense" className="text-xs">Despesas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px] p-0 relative">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm p-6">
                        <p>Sem dados para exibir neste período.</p>
                    </div>
                ) : (
                    <div className="absolute inset-0 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={isMobile ? 70 : 90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => formatMoney(value)}
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend 
                                    layout={isMobile ? 'horizontal' : 'vertical'} 
                                    verticalAlign={isMobile ? 'bottom' : 'middle'} 
                                    align={isMobile ? 'center' : 'right'}
                                    wrapperStyle={isMobile ? { fontSize: '10px', paddingTop: '10px', width: '100%' } : { fontSize: '12px', right: 0 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MonthlyBreakdownChart;