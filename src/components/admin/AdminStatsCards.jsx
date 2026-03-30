import React from 'react';
import { Users, Coins, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AdminStatsCards = ({ stats }) => {
  const { totalDistributors, totalTeamTokens, tokenValue, totalTeamPoints } = stats;

  const statCards = [
    {
      title: 'Distribuidores Ativos',
      value: formatNumberWithSuffix(totalDistributors || 0),
      icon: Users,
      description: 'Total de distribuidores neste painel (Equipe ou Externos).',
    },
    {
      title: 'Total de Pontos',
      value: formatNumberWithSuffix(totalTeamPoints || 0),
      icon: Star,
      description: 'Soma dos pontos de todas as vendas dos distribuidores selecionados.',
    },
    {
      title: 'Tokens em Circulação',
      value: formatNumberWithSuffix(totalTeamTokens || 0, 4),
      icon: Coins,
      description: 'Soma dos tokens dos distribuidores neste painel.',
    },
    {
      title: 'Valor Financeiro (Tokens)',
      value: formatCurrency(tokenValue || 0),
      icon: TrendingUp,
      description: 'Valor total em Reais (R$) correspondente aos tokens em circulação.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <TooltipProvider>
        {statCards.map((card, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Card className="card-gradient shadow-lg border-border/30 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gradient">{card.title}</CardTitle>
                  <card.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{card.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default AdminStatsCards;