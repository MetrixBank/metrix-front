import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ComposedChart } from 'recharts';
import CustomTooltip from './CustomTooltip';
import { formatCurrency } from '@/lib/utils';
import { BarChartBig, Users, ShoppingBag, ListOrdered } from 'lucide-react';

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const OpportunityCharts = ({ salesOverTimeData, topDistributorsBySalesData, topProductsData, activityStatusData, opportunityCount }) => {
  if (opportunityCount === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="card-gradient shadow-lg border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-md text-gradient flex items-center">
            <BarChartBig className="w-4 h-4 mr-2"/>Vendas ao Longo do Tempo (Filtrado)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesOverTimeData} margin={{ top: 5, right: 0, left: 0, bottom: 40 }}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" interval="preserveStartEnd" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={formatCurrency}/>
              <Tooltip content={<CustomTooltip />} formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{fontSize: "11px", paddingTop: "30px"}}/>
              <Line type="monotone" dataKey="total" name="Vendas R$" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="card-gradient shadow-lg border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-md text-gradient flex items-center">
            <Users className="w-4 h-4 mr-2"/>Top 10 Distribuidores (Faturamento vs Lucro)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={topDistributorsBySalesData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} tick={{textAnchor: 'end'}} interval={0}/>
              <Tooltip content={<CustomTooltip />} formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{fontSize: "11px"}}/>
              <Bar dataKey="total" name="Faturamento R$" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={22}/>
              <Bar dataKey="profit" name="Lucro Líquido R$" fill="#84cc16" radius={[0, 3, 3, 0]} barSize={14}/>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="card-gradient shadow-lg border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-md text-gradient flex items-center">
            <ShoppingBag className="w-4 h-4 mr-2"/>Top 10 Produtos (Unidades)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pr-4">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={topProductsData} margin={{ top: 5, right: 0, left: -20, bottom: 50 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-45} textAnchor="end" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip content={<CustomTooltip />}/>
                <Legend wrapperStyle={{fontSize: "11px", paddingTop: "40px"}}/>
                <Bar dataKey="quantity" name="Unidades" fill={PIE_COLORS[1]} radius={[3, 3, 0, 0]} barSize={25}/>
             </ComposedChart>
           </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="card-gradient shadow-lg border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-md text-gradient flex items-center">
            <ListOrdered className="w-4 h-4 mr-2"/>Status das Atividades
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pr-4">
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={activityStatusData} margin={{ top: 5, right: 0, left: -20, bottom: 50 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-45} textAnchor="end" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip content={<CustomTooltip />}/>
                <Legend wrapperStyle={{fontSize: "11px", paddingTop: "40px"}}/>
                <Bar dataKey="value" name="Quantidade" fill={PIE_COLORS[2]} radius={[3, 3, 0, 0]} barSize={25}/>
             </ComposedChart>
           </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunityCharts;