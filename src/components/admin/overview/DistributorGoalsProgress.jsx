import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, Users, Star, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';

// Metas predefinidas (mesmas do GoalsTab)
const PREDEFINED_GOALS = [
    {
        id: 'mg_weekend_2025',
        name: 'FIM DE SEMANA EM MG',
        description: 'Acumule pontos e ganhe uma viagem inesquecível!',
        startDate: '2025-06-15T00:00:00Z',
        endDate: '2025-08-15T23:59:59Z',
        targetPoints: 4,
        unit: 'pontos',
        type: 'points_accumulated',
        icon: Trophy,
    }
];

const DistributorGoalCard = ({ distributor, goalProgress, goal }) => {
    const progressPercentage = goal.targetPoints > 0 ? (goalProgress / goal.targetPoints) * 100 : 0;
    const isCompleted = goalProgress >= goal.targetPoints;

    return (
        <div className="bg-background/30 p-3 rounded-md border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-sm text-foreground">{distributor.name || distributor.email}</p>
                        <p className="text-xs text-muted-foreground">{distributor.email}</p>
                    </div>
                </div>
                <div className="text-right">
                    {isCompleted ? (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Target className="w-5 h-5 text-primary" />
                    )}
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className={`font-medium ${isCompleted ? 'text-green-500' : 'text-primary'}`}>
                        {goalProgress.toFixed(2)} / {goal.targetPoints} {goal.unit}
                    </span>
                </div>
                <Progress 
                    value={Math.min(progressPercentage, 100)} 
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" 
                />
                {isCompleted && (
                    <div className="flex items-center text-xs text-green-500 font-medium">
                        <Award className="w-3 h-3 mr-1" />
                        Meta Concluída!
                    </div>
                )}
            </div>
        </div>
    );
};

const DistributorGoalsProgress = ({ distributors, opportunities }) => {
    const [goalsProgress, setGoalsProgress] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const calculateGoalsProgress = useMemo(() => {
        if (!distributors || !opportunities) return [];

        const progress = distributors.map(distributor => {
            const distributorGoals = PREDEFINED_GOALS.map(goal => {
                if (goal.type !== 'points_accumulated') {
                    return { ...goal, currentProgress: 0 };
                }

                let currentProgress = 0;
                const goalInterval = {
                    start: startOfDay(parseISO(goal.startDate)), 
                    end: startOfDay(parseISO(goal.endDate))      
                };
                
                const POINTS_PER_CURRENCY_UNIT = 4000.0;
                let pointsFromOpportunitiesInPeriod = 0;

                // Filtrar oportunidades do distribuidor
                const distributorOpportunities = opportunities.filter(op => op.distributor_id === distributor.id);

                distributorOpportunities.forEach(op => {
                    if (op.status === 'sale_made') {
                        // Parse date correctly - treat as local date
                        let opDate;
                        if (op.visit_date.includes('T')) {
                            opDate = startOfDay(parseISO(op.visit_date));
                        } else {
                            // YYYY-MM-DD format - treat as local
                            const dateParts = op.visit_date.split('-').map(Number);
                            opDate = startOfDay(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]));
                        }
                        
                        if (isWithinInterval(opDate, goalInterval)) {
                            if (op.opportunity_products && op.opportunity_products.length > 0) {
                                op.opportunity_products.forEach(item => {
                                    if(item && item.quantity_sold && item.unit_cost_price_at_sale) {
                                        const itemCost = (parseFloat(item.quantity_sold)) * (parseFloat(item.unit_cost_price_at_sale));
                                        pointsFromOpportunitiesInPeriod += itemCost / POINTS_PER_CURRENCY_UNIT;
                                    }
                                });
                            }
                        }
                    }
                });

                currentProgress = pointsFromOpportunitiesInPeriod;

                return {
                    ...goal,
                    currentProgress: parseFloat(currentProgress.toFixed(2)),
                };
            });

            return {
                distributor,
                goals: distributorGoals
            };
        });

        return progress;
    }, [distributors, opportunities]);

    useEffect(() => {
        setIsLoading(true);
        const progress = calculateGoalsProgress;
        setGoalsProgress(progress);
        setIsLoading(false);
    }, [calculateGoalsProgress]);

    if (isLoading) {
        return (
            <Card className="card-gradient shadow-lg border-border/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gradient flex items-center">
                        <Target className="w-5 h-5 mr-2 text-primary" />
                        Progresso das Metas dos Distribuidores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-32">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!goalsProgress || goalsProgress.length === 0) {
        return (
            <Card className="card-gradient shadow-lg border-border/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gradient flex items-center">
                        <Target className="w-5 h-5 mr-2 text-primary" />
                        Progresso das Metas dos Distribuidores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        Nenhum distribuidor ou meta encontrada.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Filtrar apenas distribuidores que têm metas ativas
    const distributorsWithActiveGoals = goalsProgress.filter(dp => 
        dp.goals.some(goal => goal.type === 'points_accumulated')
    );

    // Ordenar por progresso (maior progresso primeiro)
    const sortedDistributors = distributorsWithActiveGoals.sort((a, b) => {
        const aProgress = a.goals.reduce((sum, goal) => sum + goal.currentProgress, 0);
        const bProgress = b.goals.reduce((sum, goal) => sum + goal.currentProgress, 0);
        return bProgress - aProgress;
    });

    return (
        <Card className="card-gradient shadow-lg border-border/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gradient flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Progresso das Metas dos Distribuidores
                </CardTitle>
            </CardHeader>
            <CardContent>
                {PREDEFINED_GOALS.filter(g => g.type === 'points_accumulated').map(goal => (
                    <div key={goal.id} className="mb-6">
                        <div className="flex items-center mb-4">
                            <goal.icon className="w-5 h-5 mr-2 text-yellow-500" />
                            <div>
                                <h3 className="font-semibold text-foreground">{goal.name}</h3>
                                <p className="text-xs text-muted-foreground">{goal.description}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {sortedDistributors.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    Nenhum distribuidor com progresso nesta meta.
                                </p>
                            ) : (
                                sortedDistributors.map(({ distributor, goals }) => {
                                    const distributorGoal = goals.find(g => g.id === goal.id);
                                    if (!distributorGoal) return null;
                                    
                                    return (
                                        <DistributorGoalCard
                                            key={distributor.id}
                                            distributor={distributor}
                                            goalProgress={distributorGoal.currentProgress}
                                            goal={goal}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default DistributorGoalsProgress;