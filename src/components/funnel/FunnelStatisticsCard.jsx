import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle } from 'lucide-react';

const FunnelStatisticsCard = ({ leads, stages }) => {
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsByStage = stages.reduce((acc, stage) => {
      acc[stage.id] = leads.filter(l => l.stage_id === stage.id).length;
      return acc;
    }, {});

    const closedStage = stages.find(s => s.name.toLowerCase().includes('venda') || s.name.toLowerCase().includes('realizada'));
    const closedCount = closedStage ? leadsByStage[closedStage.id] || 0 : 0;
    const conversionRate = totalLeads > 0 ? ((closedCount / totalLeads) * 100).toFixed(1) : 0;

    return { totalLeads, leadsByStage, conversionRate, closedCount };
  }, [leads, stages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
          <p className="text-xs text-muted-foreground">Monitorando funil ativo</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">{stats.closedCount} conversões realizadas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribuição</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-1">
          {stages.slice(0, 3).map(stage => (
            <div key={stage.id} className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[120px]">{stage.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${stats.totalLeads > 0 ? (stats.leadsByStage[stage.id] / stats.totalLeads) * 100 : 0}%`, backgroundColor: stage.color }} />
                </div>
                <span>{stats.leadsByStage[stage.id] || 0}</span>
              </div>
            </div>
          ))}
          {stages.length > 3 && <p className="text-xs text-muted-foreground mt-1">+ {stages.length - 3} outras etapas</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelStatisticsCard;