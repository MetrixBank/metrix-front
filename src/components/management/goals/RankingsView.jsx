import React, { useState, useEffect } from 'react';
import useTeamGoalsData from '@/hooks/useTeamGoalsData';
import useGoalRankings from '@/hooks/useGoalRankings';
import RankingTable from './RankingTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Loader2 } from 'lucide-react';

const RankingsView = () => {
    const { goals, loading: loadingGoals } = useTeamGoalsData();
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    
    // Auto-select first goal when loaded
    useEffect(() => {
        if (!selectedGoalId && goals && goals.length > 0) {
            setSelectedGoalId(goals[0].id);
        }
    }, [goals, selectedGoalId]);

    const { rankings, loading: loadingRankings } = useGoalRankings(selectedGoalId);

    if (loadingGoals) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!goals || goals.length === 0) {
         return (
            <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Sem rankings disponíveis</h3>
                <p className="text-muted-foreground">Crie metas para visualizar o ranking da equipe.</p>
            </div>
        );
    }

    const selectedGoal = goals.find(g => g.id === selectedGoalId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Quadro de Líderes
                    </h2>
                    <p className="text-sm text-muted-foreground">Selecione uma meta para ver o ranking detalhado</p>
                </div>
                <div className="w-full md:w-[300px]">
                    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma meta..." />
                        </SelectTrigger>
                        <SelectContent>
                            {goals.map(goal => (
                                <SelectItem key={goal.id} value={goal.id}>
                                    {goal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>{selectedGoal?.name || 'Ranking'}</CardTitle>
                    <CardDescription>{selectedGoal?.description || 'Desempenho da equipe'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <RankingTable rankings={rankings} loading={loadingRankings} />
                </CardContent>
            </Card>
        </div>
    );
};

export default RankingsView;