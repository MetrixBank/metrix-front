import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Flag, Trophy, Users, Edit, Trash2, TrendingUp, EyeOff, GripVertical } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import GoalCommandCenter from '@/components/admin/goals/GoalCommandCenter';
import { useDataSync } from '@/contexts/DataSyncContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TeamGoalProgressCard = ({ goal, teamMembers, onEdit, onDelete, provided, isDragging }) => {
  const [progress, setProgress] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoalData = async () => {
      setLoading(true);
      if (!goal || !teamMembers || teamMembers.length === 0) {
        setLoading(false);
        return;
      }
      
      const teamIds = teamMembers.map(m => m.id);
      let rpcData, rpcError;
      let valueField;

      switch (goal.type) {
        case 'points_accumulated':
          valueField = 'total_points';
          ({ data: rpcData, error: rpcError } = await supabase.rpc('get_sales_ranking_for_period', {
            p_start_date: format(new Date(goal.start_date), 'yyyy-MM-dd'),
            p_end_date: format(new Date(goal.end_date), 'yyyy-MM-dd'),
            p_team_member_ids: teamIds
          }));
          break;
        case 'token_ranking':
          valueField = 'total_tokens';
          ({ data: rpcData, error: rpcError } = await supabase.rpc('get_token_ranking', {
            p_team_member_ids: teamIds
          }));
          break;
        case 'team_revenue':
          valueField = 'total_revenue';
           ({ data: rpcData, error: rpcError } = await supabase.rpc('get_team_revenue_by_members', {
            p_member_ids: teamIds,
            p_start_date: format(new Date(goal.start_date), 'yyyy-MM-dd'),
            p_end_date: format(new Date(goal.end_date), 'yyyy-MM-dd'),
          }));
          break;
        default:
          setLoading(false);
          return;
      }

      if (rpcError) {
        console.error(`Error fetching goal data for ${goal.name}:`, rpcError);
        setLoading(false);
        return;
      }
      
      const initialRevenue = goal.config?.initial_revenue_value || 0;
      const currentTotalValue = rpcData.reduce((acc, item) => acc + (item[valueField] || 0), 0) + initialRevenue;
      setTotalValue(currentTotalValue);
      
      const calculatedProgress = goal.target_value_primary > 0 ? (currentTotalValue / goal.target_value_primary) * 100 : 0;
      setProgress(Math.min(calculatedProgress, 100));

      if (goal.type !== 'team_revenue' || !goal.config?.hide_ranking) {
        const sortedRanking = (rpcData || [])
          .filter(m => m[valueField] > 0)
          .sort((a, b) => b[valueField] - a[valueField]);
        setRanking(sortedRanking);
      } else {
        setRanking([]);
      }
      
      setLoading(false);
    };

    fetchGoalData();
  }, [goal, teamMembers]);

  const getUserInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  const rankingLimit = goal.config?.ranking_limit || 10;
  const hideRanking = goal.type === 'team_revenue' && goal.config?.hide_ranking;

  const getDisplayValue = (value) => {
    if (goal.type === 'team_revenue') {
        return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${parseFloat(value).toFixed(2)} ${goal.type === 'points_accumulated' ? 'pts' : 'tokens'}`;
  };

  const getTargetDisplayValue = () => {
    if (goal.type === 'team_revenue') {
        return `R$ ${parseFloat(goal.target_value_primary).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${goal.target_value_primary} ${goal.type === 'points_accumulated' ? 'pts' : 'tokens'}`;
  };

  const getCardIcon = () => {
    switch(goal.type) {
      case 'team_revenue': return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'points_accumulated': return <Trophy className="w-6 h-6 text-yellow-500"/>;
      case 'token_ranking': return <Flag className="w-6 h-6 text-primary" />;
      default: return <Flag className="w-6 h-6 text-primary" />;
    }
  }

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`mb-6 ${isDragging ? 'shadow-2xl' : ''}`}
    >
        <Card className="card-gradient shadow-lg w-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div {...provided.dragHandleProps} className="cursor-grab p-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                          <CardTitle className="text-xl font-bold text-gradient">{goal.name}</CardTitle>
                          <CardDescription>{goal.config?.subtitle || goal.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getCardIcon()}
                        {goal.created_by && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(goal)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(goal)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? <div className="h-48 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div> :
                (<>
                  <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-primary">Progresso da Equipe</span>
                          <span className="text-sm font-bold text-primary">{getDisplayValue(totalValue)} / {getTargetDisplayValue()}</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                  </div>
                  
                  {hideRanking ? (
                     <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        <EyeOff className="mx-auto h-10 w-10 mb-2" />
                        <p className="font-semibold">Foco no resultado total da equipe.</p>
                    </div>
                  ) : (
                    <div className="mt-6">
                        <h4 className="font-semibold text-md mb-3 flex items-center">
                            <Trophy className="w-5 h-5 mr-2 text-yellow-500"/>
                            Ranking da Equipe (Top {rankingLimit})
                        </h4>
                        {ranking.length > 0 ? (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {ranking.slice(0, rankingLimit).map((member, index) => (
                                <div key={member.distributor_id || member.id} className="flex items-center justify-between bg-background/50 p-2 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg w-6 text-center text-muted-foreground">{index + 1}</span>
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.avatar_url} alt={member.distributor_name} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {getUserInitials(member.distributor_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium text-sm">{member.distributor_name}</p>
                                    </div>
                                    <span className="font-semibold text-primary text-sm">{getDisplayValue(member[goal.type === 'points_accumulated' ? 'total_points' : (goal.type === 'team_revenue' ? 'total_revenue' : 'total_tokens')])}</span>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro da equipe pontuou nesta meta ainda.</p>
                        )}
                    </div>
                  )}
                </>
                )}
            </CardContent>
        </Card>
    </div>
  );
};


const TeamGoalsTab = ({ teamData, loading: teamDataLoading, error: teamDataError }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { syncKey, triggerSync } = useDataSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);

  useEffect(() => {
    const enableDnd = () => setDndEnabled(true);
    const timer = setTimeout(enableDnd, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: teamGoals, error: teamGoalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('created_by', user.id)
        .eq('distributor_type', 'team')
        .order('display_order', { ascending: true });

    if (teamGoalsError) {
      toast({ title: "Erro ao buscar metas da equipe", description: teamGoalsError.message, variant: 'destructive' });
      setGoals([]);
    } else {
      setGoals(teamGoals || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals, syncKey]);

  const handleOpenCreateModal = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleGoalUpserted = () => {
    setIsModalOpen(false);
    setGoalToEdit(null);
    triggerSync();
  };

  const handleOpenDeleteAlert = (goal) => {
    setGoalToDelete(goal);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalToDelete.id);

    if (error) {
      toast({ title: "Erro ao excluir meta", description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Meta excluída com sucesso!", variant: 'success' });
      triggerSync();
    }
    setGoalToDelete(null);
    setIsDeleteAlertOpen(false);
  };

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const activeGoals = getActiveGoals();
    const reorderedGoals = Array.from(activeGoals);
    const [removed] = reorderedGoals.splice(source.index, 1);
    reorderedGoals.splice(destination.index, 0, removed);

    const updatedGoalsForState = [...reorderedGoals, ...getPastGoals()];
    setGoals(updatedGoalsForState);

    const updates = reorderedGoals.map((goal, index) => ({
      id: goal.id,
      display_order: index + 1,
    }));

    const { error } = await supabase.from('goals').upsert(updates);

    if (error) {
      toast({ title: "Erro ao reordenar metas", description: error.message, variant: 'destructive' });
      fetchGoals(); // Revert state on error
    } else {
      toast({ title: "Ordem das metas atualizada!", variant: 'success' });
    }
  };

  const getActiveGoals = () => {
    const now = new Date();
    return goals
      .filter(g => {
        const endDate = new Date(g.end_date);
        endDate.setHours(23, 59, 59, 999);
        return new Date(g.start_date) <= now && endDate >= now;
      })
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getPastGoals = () => {
    const now = new Date();
    return goals.filter(g => new Date(g.end_date) < now).sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
  };

  const activeGoals = getActiveGoals();
  const pastGoals = getPastGoals();
  
  if (loading || teamDataLoading || !dndEnabled) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
   if (teamDataError) {
    return <div className="text-center text-destructive py-10">Erro ao carregar dados da equipe para as metas.</div>;
  }
  
  const teamMembersForGoals = teamData?.distributors;

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gradient">Metas da Equipe</h2>
            <Button onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4 mr-2" /> Criar Meta
            </Button>
        </div>

        <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                    <Flag className="w-4 h-4 mr-2" />
                    Metas Ativas
                </TabsTrigger>
                <TabsTrigger value="past">
                    <Trophy className="w-4 h-4 mr-2" />
                    Metas Encerradas
                </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                 {activeGoals.length > 0 ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="active-goals">
                        {(provided) => (
                          <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6"
                          >
                            {activeGoals.map((goal, index) => (
                              <Draggable key={goal.id} draggableId={String(goal.id)} index={index}>
                                {(provided, snapshot) => (
                                  <TeamGoalProgressCard 
                                      goal={goal} 
                                      teamMembers={teamMembersForGoals} 
                                      onEdit={handleOpenEditModal}
                                      onDelete={handleOpenDeleteAlert}
                                      provided={provided}
                                      isDragging={snapshot.isDragging}
                                  />
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                ) : (
                    <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
                        <Users className="mx-auto h-12 w-12 mb-4" />
                        <p className="font-semibold">Nenhuma meta de equipe ativa no momento.</p>
                        <p className="text-sm">Crie uma nova meta para engajar seu time!</p>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="past" className="mt-6">
                 {pastGoals.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pastGoals.map(goal => (
                             <motion.div key={goal.id}>
                               <Card className="card-gradient shadow-lg w-full">
                                 <CardHeader>
                                   <div className="flex justify-between items-start">
                                     <div>
                                       <CardTitle className="text-xl font-bold text-gradient">{goal.name}</CardTitle>
                                       <CardDescription>{goal.config?.subtitle || goal.description}</CardDescription>
                                     </div>
                                   </div>
                                 </CardHeader>
                                 <CardContent>
                                   <p className="text-sm text-muted-foreground">Meta encerrada em {format(new Date(goal.end_date), 'dd/MM/yyyy')}.</p>
                                 </CardContent>
                               </Card>
                             </motion.div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
                        <Trophy className="mx-auto h-12 w-12 mb-4" />
                        <p className="font-semibold">Nenhuma meta de equipe encerrada ainda.</p>
                        <p className="text-sm">O histórico de metas aparecerá aqui.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
      
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{goalToEdit ? 'Editar Meta da Equipe' : 'Criar Nova Meta para a Equipe'}</DialogTitle>
                    <DialogDescription>
                        {goalToEdit ? 'Ajuste os detalhes da meta existente.' : 'Defina um novo desafio para seu time e acompanhe o progresso.'}
                    </DialogDescription>
                </DialogHeader>
                <GoalCommandCenter 
                    goalToEdit={goalToEdit}
                    onGoalUpserted={handleGoalUpserted}
                    distributorTypeForNewGoal="team"
                    goalsCount={goals.length}
                />
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a meta{' '}
                        <span className="font-bold">"{goalToDelete?.name}"</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteGoal} className={buttonVariants({ variant: "destructive" })}>
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default TeamGoalsTab;