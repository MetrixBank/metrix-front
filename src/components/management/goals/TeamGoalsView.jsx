import React, { useState } from 'react';
import useTeamGoals from '@/hooks/useTeamGoals';
import TeamGoalRankingCard from './TeamGoalRankingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Users } from 'lucide-react';

const TeamGoalsView = () => {
    const { goals, loading, hasManager } = useTeamGoals();
    const [activeTab, setActiveTab] = useState('active');

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
            </div>
        );
    }

    if (!hasManager) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed">
                <Users className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Você não tem um sublíder</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                    Metas de equipe são definidas pelo seu gestor direto. Entre em contato com o suporte se acredita que isso é um erro.
                </p>
            </div>
        );
    }

    const activeGoals = goals.filter(g => g.status === 'active' || new Date(g.end_date) >= new Date());
    const endedGoals = goals.filter(g => g.status !== 'active' && new Date(g.end_date) < new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6 rounded-2xl border border-purple-200/10">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Metas em Equipe</h2>
                    <p className="text-muted-foreground">Acompanhe o desempenho do seu time e sua posição no ranking.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="active">Metas Ativas</TabsTrigger>
                    <TabsTrigger value="ended">Metas Encerradas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-6">
                    {activeGoals.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            Nenhuma meta de equipe ativa no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeGoals.map(goal => (
                                <TeamGoalRankingCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </TabsContent>
                
                <TabsContent value="ended" className="mt-6">
                    {endedGoals.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            Nenhuma meta encerrada para exibir.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {endedGoals.map(goal => (
                                <TeamGoalRankingCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TeamGoalsView;