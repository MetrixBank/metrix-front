import React, { useState } from 'react';
import useTeamGoals from '@/hooks/useTeamGoals';
import TeamGoalRankingCard from './TeamGoalRankingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TeamGoalsDisplay = () => {
    const { goals, loading, hasManager, error } = useTeamGoals();
    const [activeTab, setActiveTab] = useState('active');

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />)}
            </div>
        );
    }

    if (error) {
        return (
             <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Não foi possível carregar as metas de equipe. Tente novamente mais tarde.</AlertDescription>
             </Alert>
        );
    }

    if (!hasManager) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-dashed border-muted">
                <div className="bg-violet-500/10 p-4 rounded-full mb-4">
                    <Users className="h-10 w-10 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Você não tem um sublíder</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                    Metas de equipe são definidas pelo seu gestor direto e aparecerão aqui quando você for adicionado a uma equipe.
                </p>
            </div>
        );
    }

    const activeGoals = goals.filter(g => g.status === 'active' || (g.end_date && new Date(g.end_date) >= new Date()));
    const endedGoals = goals.filter(g => g.status !== 'active' && (g.end_date && new Date(g.end_date) < new Date()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Metas em Equipe</h2>
                    <p className="text-muted-foreground">Ranking e desempenho do seu time.</p>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
                        <TabsTrigger value="active" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">Ativas</TabsTrigger>
                        <TabsTrigger value="ended" className="data-[state=active]:bg-muted-foreground/20 data-[state=active]:text-foreground">Encerradas</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <TabsContent value="active" className="mt-0 space-y-6">
                {activeGoals.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-dashed border-muted">
                        <Users className="mx-auto h-12 w-12 opacity-50 mb-3" />
                        <h3 className="text-lg font-medium text-foreground">Nenhuma meta ativa</h3>
                        <p>Nenhuma meta de equipe ativa no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeGoals.map(goal => (
                            <TeamGoalRankingCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </TabsContent>
            
            <TabsContent value="ended" className="mt-0 space-y-6">
                {endedGoals.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-dashed border-muted">
                         <h3 className="text-lg font-medium text-foreground">Histórico vazio</h3>
                        <p>Nenhuma meta encerrada para exibir.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {endedGoals.map(goal => (
                            <TeamGoalRankingCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                )}
            </TabsContent>
        </div>
    );
};

export default TeamGoalsDisplay;