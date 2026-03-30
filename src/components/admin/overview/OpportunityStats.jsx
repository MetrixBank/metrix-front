import React from 'react';
import { AlertTriangle, Eye, PackageCheck, DollarSign, ShoppingBag, Target, TrendingUp, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import OverviewStatCard from './OverviewStatCard';

const OpportunityStats = ({ stats }) => {
  // Render cards even with 0 values to maintain layout structure exactly as shown in user image
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      <OverviewStatCard 
        title="Visitas" 
        value={(stats?.totalVisits || 0).toString()} 
        icon={<Eye />} 
      />
      <OverviewStatCard 
        title="Vendas" 
        value={(stats?.totalSalesMade || 0).toString()} 
        icon={<PackageCheck />} 
        color="text-green-500" 
      />
      <OverviewStatCard 
        title="Valor Vendido" 
        value={formatCurrency(stats?.totalSaleValue || 0)} 
        icon={<DollarSign />} 
        color="text-green-500" 
      />
      <OverviewStatCard 
        title="Produtos (Un.)" 
        value={(stats?.totalProductsSoldUnits || 0).toString()} 
        icon={<ShoppingBag />} 
      />
      <OverviewStatCard 
        title="Pontos" 
        // Using locale string to match the "103,24" format style from image
        value={(stats?.totalPointsGenerated || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
        icon={<Star />} 
        color="text-yellow-400" 
      />
      <OverviewStatCard 
        title="Conversão" 
        value={(stats?.conversionRate || 0).toFixed(1)} 
        unit="%" 
        icon={<Target />} 
        color="text-accent" 
      />
      <OverviewStatCard 
        title="Ticket Médio" 
        value={formatCurrency(stats?.averageTicket || 0)} 
        icon={<TrendingUp />} 
        color="text-accent" 
      />
    </div>
  );
};

export default OpportunityStats;