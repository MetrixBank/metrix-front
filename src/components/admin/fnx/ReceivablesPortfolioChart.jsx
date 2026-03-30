import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const ReceivablesPortfolioChart = ({ data }) => {
  // Data expected: [{ name: 'Paid', value: 100, fill: '...' }, ...]
  
  const hasData = data && data.some(item => item.value > 0);

  return (
    <Card className="h-full shadow-md border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Status da Carteira</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] min-h-[300px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value) => formatCurrency(value)}
                 contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                 itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <div className="w-32 h-32 rounded-full border-4 border-muted border-dashed flex items-center justify-center opacity-50">
                <span className="text-xs">Sem dados</span>
            </div>
            <p>Carteira vazia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceivablesPortfolioChart;