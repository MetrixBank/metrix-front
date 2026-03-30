import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const MonthlyCashflowChart = ({ data }) => {
  // Data expected: [{ month_label: '2023-10', total_amount: 1500 }]
  
  const formattedData = data && Array.isArray(data) ? data.map(item => ({
    ...item,
    formattedLabel: item.month_label ? item.month_label.split('-').reverse().join('/') : '-', // Convert YYYY-MM to MM/YYYY
    amount: Number(item.total_amount)
  })) : [];

  return (
    <Card className="h-full shadow-md border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Fluxo de Caixa Mensal (Recebíveis)</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] min-h-[300px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedLabel" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value) => [formatCurrency(value), 'Receita']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Nenhum dado de fluxo de caixa disponível.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyCashflowChart;