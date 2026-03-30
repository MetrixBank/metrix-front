import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, DollarSign } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-3 border rounded-lg shadow-lg">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          {`Faturamento: ${formatCurrency(payload[0].value)}`}
        </p>
      </div>
    );
  }
  return null;
};

const MonthlyComparisonChart = ({ currentMonthRevenue, lastMonthRevenue }) => {
    const data = [
        { name: 'Mês Anterior', Faturamento: lastMonthRevenue, fill: '#f59e0b' },
        { name: 'Mês Atual', Faturamento: currentMonthRevenue, fill: '#10b981' },
    ];

    return (
        <Card className="shadow-lg h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-primary"/>
                    Comparativo Mensal
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/>
                        <Bar dataKey="Faturamento" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default MonthlyComparisonChart;