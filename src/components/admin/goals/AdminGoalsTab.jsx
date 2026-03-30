import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Users, Star, Award, TrendingUp, AlertTriangle, Loader2, PartyPopper, CheckCircle, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MonthlyRankingGoal from '@/components/admin/goals/MonthlyRankingGoal';
import PastChampions from '@/components/admin/goals/PastChampions';
import TokenRankingGoal from '@/components/admin/goals/TokenRankingGoal';
import GoalCommandCenter from '@/components/admin/goals/GoalCommandCenter';
import { useDataSync } from '@/contexts/DataSyncContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GoalProgressCard = ({ goal, distributorProgress, distributorType }) => {
  const qualifiedForParticipationCount = distributorProgress.filter(d => d.currentProgress >= goal.target_value_secondary).length;
  const qualifiedForAllInclusiveCount = distributorProgress.filter(d => d.currentProgress >= goal.target_value_primary).length;
  const totalDistributors = distributorProgress.length;

  const nearGoalDistributors = distributorProgress
    .filter(d => d.currentProgress > 0 && d.currentProgress < goal.target_value_secondary)
    .sort((a, b) => b.currentProgress - a.currentProgress);

  const qualifiedDistributors = distributorProgress
    .filter(d => d.currentProgress >= goal.target_value_secondary)
    .sort((a, b) => b.currentProgress - a.currentProgress);

  return (
    <Card className="card-gradient shadow-lg border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gradient flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          {goal.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{goal.description}</p>
        {goal.config?.subtitle && (
          <p className="text-xs font-semibold text-amber-500 mt-1 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1.5"/> {goal.config.subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/50 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Distribuidores ({distributorType === 'team' ? 'Equipe' : 'Externos'})</p>
                <p className="text-lg font-bold text-foreground">{totalDistributors}</p>
              </div>
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div className="bg-background/50 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Qualificados (Participação)</p>
                <p className="text-lg font-bold text-blue-500">{qualifiedForParticipationCount}</p>
              </div>
              <PartyPopper className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-background/50 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Qualificados (Prêmio Máximo)</p>
                <p className="text-lg font-bold text-green-500">{qualifiedForAllInclusiveCount}</p>
              </div>
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Distribuidores Qualificados
                </h4>
                 {qualifiedDistributors.length === 0 ? (
                    <p className="text-xs text-muted-foreground pt-4 text-center">Nenhum distribuidor qualificado ainda.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {qualifiedDistributors.map(dist => {
                            const isAllInclusive = dist.currentProgress >= goal.target_value_primary;
                            return (
                                <div key={dist.distributorId} className="bg-background/30 p-3 rounded-md border">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-sm">{dist.distributorName}</p>
                                            <p className="text-xs text-muted-foreground">{dist.distributorEmail}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${isAllInclusive ? 'text-green-500' : 'text-blue-500'}`}>
                                                {dist.currentProgress.toFixed(2)} pts
                                            </p>
                                            {isAllInclusive && <p className="text-xs text-green-500 flex items-center justify-end"><Trophy className="w-3 h-3 mr-1" />Prêmio Máximo!</p>}
                                            {!isAllInclusive && <p className="text-xs text-blue-500 flex items-center justify-end"><CheckCircle className="w-3 h-3 mr-1" />Garantido!</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                    Quase Lá!
                </h4>
                {nearGoalDistributors.length === 0 ? (
                    <p className="text-xs text-muted-foreground pt-4 text-center">Ninguém na disputa por enquanto.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {nearGoalDistributors.map(dist => (
                                <div key={dist.distributorId} className="bg-background/30 p-3 rounded-md border">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <p className="font-medium text-sm">{dist.distributorName}</p>
                                          <p className="text-xs text-muted-foreground">{dist.distributorEmail}</p>
                                      </div>
                                      <p className="text-sm font-medium text-orange-500">{dist.currentProgress.toFixed(2)} pts</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>

        <div className="text-xs text-muted-foreground bg-background/30 p-2 rounded border mt-4">
          <p className="flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1.5" />
            Período: {format(parseISO(goal.start_date), 'dd/MM/yyyy')} - {format(parseISO(goal.end_date), 'dd/MM/yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminGoalsTab = ({ distributorType }) => {
  const [distributorProgress, setDistributorProgress] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastRankings, setPastRankings] = useState([]);
  const [loadingPastRankings, setLoadingPastRankings] = useState(true);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const { syncKey, triggerSync } = useDataSync();


  const fetchGoalsAndProgress = useCallback(async () => {
    setLoading(true);
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true);
      if (goalsError) throw goalsError;
      setActiveGoals(goalsData || []);

      if (goalsData.length === 0) {
        setDistributorProgress([]);
        setLoading(false);
        return;
      }
      
      const goal = goalsData[0]; // Assuming one main campaign goal for now
      const { data, error } = await supabase.rpc('get_sales_ranking_for_period', {
        p_start_date: goal.start_date,
        p_end_date: goal.end_date
      });
      if (error) throw error;
      
      const { data: allDistributors, error: distributorsError } = await supabase
        .from('profiles')
        .select('id, name, email, distributor_type')
        .in('role', ['distributor', 'sub-admin']); // Include sub-admins and distributors
      if (distributorsError) throw distributorsError;
      
      const relevantDistributors = allDistributors.filter(d => {
        if (distributorType === 'team') return d.distributor_type === 'team';
        if (distributorType === 'external') return d.distributor_type === 'external';
        return true; 
      });

      const progressData = relevantDistributors.map(distributor => {
          const rankingData = data.find(d => d.distributor_id === distributor.id);
          return {
            distributorId: distributor.id,
            distributorName: distributor.name || distributor.email,
            distributorEmail: distributor.email,
            currentProgress: rankingData ? parseFloat(rankingData.total_points) : 0
          };
        });

      setDistributorProgress(progressData);
    } catch (error) {
      console.error('Error fetching goals progress:', error);
      toast({ title: 'Erro ao carregar progresso das metas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [distributorType]);

  const fetchPastRankings = useCallback(async () => {
    setLoadingPastRankings(true);
    try {
      const { data, error } = await supabase
          .from('sales_opportunities')
          .select('distributor_id, profiles!inner(name, avatar_url, distributor_type), visit_date, opportunity_products!inner(quantity_sold, unit_cost_price_at_sale)')
          .eq('status', 'sale_made')
          .gte('visit_date', '2025-06-01')
          .lte('visit_date', format(new Date(), 'yyyy-MM-dd'));
      
      if (error) throw error;

      const filteredData = data.filter(d => {
          const profile = d.profiles;
          if (distributorType === 'team') return profile.distributor_type === 'team';
          if (distributorType === 'external') return profile.distributor_type === 'external';
          return false;
      });
      
      const pointsData = filteredData.flatMap(d => {
        const totalPointsForSale = d.opportunity_products.reduce((acc, p) => acc + (p.quantity_sold * p.unit_cost_price_at_sale), 0) / 4000;
        return {
          distributor_id: d.distributor_id,
          distributor_name: d.profiles.name,
          avatar_url: d.profiles.avatar_url,
          total_points: totalPointsForSale,
          sale_date: d.visit_date
        }
      });

      setPastRankings(pointsData);
    } catch (error) {
        console.error('Error fetching past rankings:', error);
        toast({ title: 'Erro ao buscar campeões anteriores', description: error.message, variant: 'destructive' });
    } finally {
        setLoadingPastRankings(false);
    }
  }, [distributorType]);

  const handleGoalCreated = () => {
    setIsCommandCenterOpen(false);
    triggerSync();
  };

  useEffect(() => {
    fetchGoalsAndProgress();
    fetchPastRankings();
  }, [fetchGoalsAndProgress, fetchPastRankings, syncKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gradient flex items-center">
            <Target className="w-7 h-7 mr-3 text-primary" />
            Metas e Competições ({distributorType === 'team' ? 'Equipe' : 'Externos'})
          </h2>
          <p className="text-muted-foreground">Acompanhe o progresso das metas ativas e o ranking mensal.</p>
        </div>
        <Dialog open={isCommandCenterOpen} onOpenChange={setIsCommandCenterOpen}>
          <DialogTrigger asChild>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Central de Comando de Metas</DialogTitle>
            </DialogHeader>
            <GoalCommandCenter onGoalCreated={handleGoalCreated}/>
          </DialogContent>
        </Dialog>
      </div>
      
      <TokenRankingGoal distributorType={distributorType} />
      <MonthlyRankingGoal distributorType={distributorType} />

      <PastChampions rankings={pastRankings} loading={loadingPastRankings} />

      <div className="space-y-6">
        {activeGoals.filter(g => g.type === 'points_accumulated').map(goal => (
          <GoalProgressCard
            key={goal.id}
            goal={goal}
            distributorProgress={distributorProgress}
            distributorType={distributorType}
          />
        ))}
      </div>

      {activeGoals.filter(g => g.type === 'points_accumulated').length === 0 && (
        <Card className="card-gradient">
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma meta de campanha de pontos ativa no momento.</p>
            <p className="text-sm text-muted-foreground">Use a Central de Comando para criar uma nova meta!</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default AdminGoalsTab;