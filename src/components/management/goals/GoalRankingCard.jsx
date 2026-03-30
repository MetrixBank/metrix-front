import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, MoreVertical, Coins, Banknote, Star } from 'lucide-react';
import { cn, formatGoalValue } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const GoalRankingCard = ({ goal, currentProgress = 0 }) => {
    const target = Number(goal.target_value_primary) || 0;
    const progressPercent = target > 0 ? Math.min(100, (currentProgress / target) * 100) : 0;
    const rankingType = goal.ranking_type || 'points';

    const getIcon = () => {
        if (rankingType === 'revenue') return <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        if (rankingType === 'tokens') return <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
        return <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    };

    const getColors = () => {
        if (rankingType === 'revenue') return {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            bar: 'from-emerald-500 to-green-600',
            badge: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
        };
        if (rankingType === 'tokens') return {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            bar: 'from-blue-500 to-cyan-600',
            badge: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'
        };
        return {
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600 dark:text-purple-400',
            bar: 'from-purple-500 to-violet-600',
            badge: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300'
        };
    };

    const colors = getColors();

    return (
        <Card className="rounded-xl shadow-lg border-none overflow-hidden bg-white dark:bg-slate-900 h-full flex flex-col">
            <CardHeader className="p-6 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn("p-2 rounded-lg", colors.bg)}>
                            {getIcon()}
                        </div>
                        <h3 className={cn("text-xl font-bold leading-tight", colors.text)}>
                            {goal.name}
                        </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px]">
                        {goal.description || "Sem descrição disponível."}
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-purple-600">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-6 pt-4 flex-1 flex flex-col justify-end">
                <div className="space-y-3">
                    <div className="flex justify-between items-end text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Progresso Atual</span>
                        <div className="text-right">
                             <span className={cn("text-lg font-bold", colors.text)}>
                                {formatGoalValue(currentProgress, rankingType).split(' ')[0]} {/* Display number part highlighted */}
                             </span>
                             <span className="text-slate-400 ml-1 text-xs">/ {formatGoalValue(target, rankingType)}</span>
                        </div>
                    </div>
                    
                    <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full bg-gradient-to-r transition-all duration-1000 ease-out rounded-full shadow-sm", colors.bar)}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <Badge variant="secondary" className={cn("border-none", colors.badge)}>
                            {progressPercent.toFixed(1)}% Concluído
                        </Badge>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            {rankingType === 'revenue' ? 'Faturamento' : rankingType === 'tokens' ? 'Tokens' : 'Pontos'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GoalRankingCard;