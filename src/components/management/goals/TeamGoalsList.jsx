import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Target, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TeamGoalsList = ({ goals, onSelectGoal, selectedGoalId }) => {
    if (!goals || goals.length === 0) {
        return (
            <div className="text-center py-8 bg-muted/5 rounded-xl border border-dashed border-muted">
                <p className="text-muted-foreground text-sm">Nenhuma meta de equipe ativa.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Campanhas Ativas
            </h3>
            
            <div className="grid gap-4">
                {goals.map((goal) => {
                    const daysRemaining = differenceInDays(new Date(goal.end_date), new Date());
                    const isSelected = selectedGoalId === goal.id;
                    const progress = goal.stats?.progressPercentage || 0;
                    const isCompleted = progress >= 100;

                    return (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onSelectGoal(goal)}
                            className={cn(
                                "cursor-pointer rounded-xl border transition-all duration-200 relative overflow-hidden group",
                                isSelected 
                                    ? "bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
                                    : "bg-card/50 border-white/5 hover:bg-card hover:border-white/10"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />
                            )}

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "mb-2 border-0",
                                            isCompleted 
                                                ? "bg-emerald-500/20 text-emerald-400" 
                                                : "bg-indigo-500/20 text-indigo-400"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluída</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Em Andamento</span>
                                        )}
                                    </Badge>
                                    
                                    <div className={cn(
                                        "text-xs font-mono font-bold px-2 py-1 rounded flex items-center gap-1.5",
                                        daysRemaining < 5 ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400"
                                    )}>
                                        <Clock className="w-3 h-3" />
                                        {daysRemaining > 0 ? `${daysRemaining} dias` : 'Hoje'}
                                    </div>
                                </div>

                                <h4 className={cn("font-bold text-base mb-1", isSelected ? "text-indigo-200" : "text-slate-200")}>
                                    {goal.name}
                                </h4>
                                
                                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                                    {goal.description}
                                </p>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Progresso da Equipe</span>
                                        <span className={cn("font-bold", isCompleted ? "text-emerald-400" : "text-indigo-400")}>
                                            {progress.toFixed(0)}%
                                        </span>
                                    </div>
                                    <Progress value={progress} className="h-1.5 bg-slate-800" indicatorClassName={isCompleted ? "bg-emerald-500" : "bg-indigo-500"} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamGoalsList;