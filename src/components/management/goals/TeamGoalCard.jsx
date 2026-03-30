import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, MoreVertical, Plane, Target, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import useTeamGoalsRankings from '@/hooks/useTeamGoalsRankings';
import TeamGoalRankingLeaderboard from './TeamGoalRankingLeaderboard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TeamGoalCard = ({ goal }) => {
    const { rankings, loading, currentUserRank, teamProgress, metricLabel } = useTeamGoalsRankings(goal);

    // Calculate progress percentage
    const targetValue = Number(goal.target_value_primary) || 10000;
    const progressPercentage = Math.min(100, (teamProgress / targetValue) * 100);

    // Format numbers
    const formattedProgress = metricLabel === 'R$' 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(teamProgress)
        : teamProgress.toFixed(2);

    const formattedTarget = metricLabel === 'R$'
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetValue)
        : targetValue;

    const endDate = new Date(goal.end_date);

    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl w-full hover:border-slate-700/50 transition-colors duration-300">
            <CardContent className="p-5 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                        <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)] shrink-0">
                            <Trophy className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                                    {goal.name}
                                </h3>
                                {goal.type === 'travel' && <Plane className="w-4 h-4 text-purple-400 animate-pulse" />}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-lg mb-2">
                                {goal.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-950/50 w-fit px-2 py-1 rounded-md border border-white/5">
                                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                <span>Encerra em {format(endDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="sm:hidden p-2 bg-slate-800/50 rounded-lg">
                             <Trophy className="w-5 h-5 text-yellow-400" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
                                <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer">Ver Detalhes</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer">Regras da Campanha</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    <div className="flex justify-between items-end mb-2.5 text-sm">
                        <span className="text-purple-300 font-semibold tracking-wide text-xs uppercase flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Progresso da Equipe
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-white font-bold text-lg tabular-nums">{formattedProgress}</span>
                            <span className="text-slate-500 text-xs font-medium">/ {formattedTarget} {metricLabel}</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full shadow-[0_0_10px_rgba(192,38,211,0.5)] relative",
                                "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] skew-x-12" />
                        </motion.div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-slate-950/30 rounded-xl p-4 sm:p-5 border border-slate-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <TeamGoalRankingLeaderboard 
                        rankings={rankings} 
                        currentUserRank={currentUserRank} 
                        loading={loading} 
                        metricLabel={metricLabel}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default TeamGoalCard;