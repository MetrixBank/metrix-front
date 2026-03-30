import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SubAdminTeamLayout from './layout/SubAdminTeamLayout';
import SubAdminTeamOverviewTab from './SubAdminTeamOverviewTab';
import TeamGenealogyTab from './genealogy/TeamGenealogyTab';
import TeamActivitiesTab from './TeamActivitiesTab';
import TeamAgendaTab from './TeamAgendaTab';
import TeamVisualAgenda from './TeamVisualAgenda';
import TeamCustomersTab from './TeamCustomersTab';
import TeamStockTab from './TeamStockTab';
import TeamGoalsTab from './TeamGoalsTab';
import useSubAdminTeamData from '@/hooks/useSubAdminTeamData';
import { useDataSync } from '@/contexts/DataSyncContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, startOfToday, endOfToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const TeamDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { data, loading, error, refetch } = useSubAdminTeamData(user?.id);
  const { syncKey } = useDataSync(); 

  // Shared Date Filter State
  const [dateFilter, setDateFilter] = useState({
      preset: 'month',
      label: 'Este Mês',
      startDate: startOfMonth(new Date()).toISOString(),
      endDate: endOfMonth(new Date()).toISOString()
  });

  const updateDateFilter = (preset) => {
      const now = new Date();
      let start = '', end = '', label = '';

      switch (preset) {
          case 'today':
              start = startOfToday().toISOString();
              end = endOfToday().toISOString();
              label = 'Hoje';
              break;
          case 'week':
              start = startOfWeek(now, { locale: ptBR }).toISOString();
              end = endOfWeek(now, { locale: ptBR }).toISOString();
              label = 'Esta Semana';
              break;
          case 'month':
              start = startOfMonth(now).toISOString();
              end = endOfMonth(now).toISOString();
              label = 'Este Mês';
              break;
          case 'all':
              start = null;
              end = null;
              label = 'Todo Período';
              break;
          default:
              break;
      }
      setDateFilter({ preset, label, startDate: start, endDate: end });
  };

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
        refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Manual refresh via DataSync context or other triggers
  useEffect(() => {
    if (syncKey > 0) refetch();
  }, [syncKey, refetch]);

  const handleManualRefresh = async () => {
      await refetch();
      toast({
          title: "Dados atualizados",
          description: "As informações da equipe foram sincronizadas.",
          duration: 3000,
      });
  };

  const hasAccess = user && (
    user.role === 'sub-admin' || 
    user.distributor_type === 'sub-admin' ||
    user.role === 'admin' || 
    user.role === 'master-admin'
  );

  if (!hasAccess) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4">
            <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
            <p className="text-slate-400">Você não tem permissão para visualizar o painel de equipe.</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Voltar ao Início</Button>
        </div>
    );
  }

  if (error) {
    return (
        <SubAdminTeamLayout activeTab={activeTab} setActiveTab={setActiveTab}>
             <div className="flex flex-col items-center justify-center h-[50vh] gap-4 p-8 border border-red-500/20 rounded-xl bg-red-500/5">
                <h2 className="text-xl font-bold text-red-400">Erro ao carregar dashboard</h2>
                <p className="text-slate-300 text-center max-w-md">{error.message}</p>
                <Button onClick={refetch} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
                </Button>
            </div>
        </SubAdminTeamLayout>
    );
  }

  const renderContent = () => {
      switch (activeTab) {
          case 'overview':
              return <SubAdminTeamOverviewTab data={data} loading={loading} refetch={refetch} dateFilter={dateFilter} />;
          case 'agenda':
              return <TeamAgendaTab 
                        activities={data.opportunities} 
                        distributors={data.distributors} 
                        loading={loading}
                        dateFilter={dateFilter} 
                     />;
          case 'visual-agenda':
              return <TeamVisualAgenda
                        activities={data.opportunities} 
                        distributors={data.distributors} 
                        loading={loading}
                        dateFilter={dateFilter} 
                     />;
          case 'activities':
              return <TeamActivitiesTab 
                        activities={data.opportunities} 
                        distributors={data.distributors} 
                        loading={loading}
                        dateFilter={dateFilter} 
                     />;
          case 'team':
              return <TeamGenealogyTab members={data.distributors} loading={loading} />;
          case 'customers':
              return <TeamCustomersTab customers={data.customers} loading={loading} />;
          case 'stock':
              return <TeamStockTab products={data.products} loading={loading} />;
          case 'goals':
              return <TeamGoalsTab loading={loading} />;
          default:
              return <SubAdminTeamOverviewTab data={data} loading={loading} refetch={refetch} dateFilter={dateFilter} />;
      }
  };

  return (
    <SubAdminTeamLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 absolute right-0 top-0 -mt-16 mr-6 hidden md:flex pointer-events-auto z-10">
                {/* Back to User Area */}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/dashboard')}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 mr-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Área do Usuário
                </Button>

                {/* Shared Filter Controls for Relevant Tabs */}
                {(['overview', 'agenda', 'visual-agenda', 'activities'].includes(activeTab)) && (
                    <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700 backdrop-blur-sm shadow-sm mr-4">
                        <Button 
                            variant={dateFilter.preset === 'today' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => updateDateFilter('today')}
                            className="text-xs h-7 px-2"
                        >
                            Hoje
                        </Button>
                        <Button 
                            variant={dateFilter.preset === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => updateDateFilter('week')}
                            className="text-xs h-7 px-2"
                        >
                            Semana
                        </Button>
                         <Button 
                            variant={dateFilter.preset === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => updateDateFilter('month')}
                            className="text-xs h-7 px-2"
                        >
                            Mês
                        </Button>
                        <Button 
                            variant={dateFilter.preset === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => updateDateFilter('all')}
                            className="text-xs h-7 px-2"
                        >
                            Todos
                        </Button>
                    </div>
                )}

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleManualRefresh}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>
            </div>
            {renderContent()}
        </div>
    </SubAdminTeamLayout>
  );
};

export default TeamDashboard;