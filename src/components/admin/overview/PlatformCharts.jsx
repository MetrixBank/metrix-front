import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Coins, UserPlus } from 'lucide-react';
import AdminTotalRevenueChart from '@/components/admin/AdminTotalRevenueChart';
import AdminTopDistributorsChart from '@/components/admin/AdminTopDistributorsChart';
import AdminNewUsersChart from '@/components/admin/AdminNewUsersChart';

const PlatformCharts = ({ totalRevenueChartData, topDistributorsByTokensChartData, newUsersChartData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <Card className="card-gradient shadow-lg border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-md text-gradient">
          <BarChart3 className="w-4 h-4 mr-2"/>Receita (6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTotalRevenueChart data={totalRevenueChartData} />
      </CardContent>
    </Card>
    
    <Card className="card-gradient shadow-lg border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-md text-gradient">
          <Coins className="w-4 h-4 mr-2 text-accent"/>Top Distribuidores (Tokens)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTopDistributorsChart data={topDistributorsByTokensChartData} type="tokens" />
      </CardContent>
    </Card>
    
    <Card className="card-gradient shadow-lg border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-md text-gradient">
          <UserPlus className="w-4 h-4 mr-2 text-purple-500"/>Novos Distribuidores (6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdminNewUsersChart data={newUsersChartData} />
      </CardContent>
    </Card>
  </div>
);

export default PlatformCharts;