import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Calendar, Users, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useTeamGoalsRankings from '@/hooks/useTeamGoalsRankings';
import { Skeleton } from '@/components/ui/skeleton';

const RankingItem = ({ rank, user, metricLabel }) => {
    let BadgeIcon = null;
    let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";

    if (rank === 1) {
        BadgeIcon = Crown;
        badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-200 ring-1 ring-yellow-400/50";
    } else if (rank === 2) {
        BadgeIcon = Medal;
        badgeColor = "bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-400/50";
    } else if (rank === 3) {
        BadgeIcon = Medal;
        badgeColor = "bg-orange-100 text-orange-800 border-orange-200 ring-1 ring-orange-400/50";
    } else {
        badgeColor = "bg-violet-50 text-violet-700 border-violet-100";
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.05 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border mb-2 transition-all hover:shadow-md",
                user.isCurrentUser ? "bg-violet-50/80 border-violet-200 shadow-sm" : "bg-white/50 border-transparent hover:bg-white"
            )}
        >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm font-bold text-xs", badgeColor)}>
                {BadgeIcon ? <BadgeIcon className="w-4 h-4" /> : `${rank}º`}
            </div>
            
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-slate-100 text-slate-600">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <span className={cn("font-semibold text-sm truncate", user.isCurrentUser && "text-violet-700")}>
                        {user.name} {user.isCurrentUser && "(Você)"}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                        {user.formattedValue} <span className="text-slate-400 font-normal">{metricLabel}</span>
                    </span>
                </div>
                <Progress 
                    value={user.percentage} 
                    className="h-1.5" 
                    indicatorClassName={
                        rank === 1 ? "bg-yellow-500" : 
                        rank === 2 ? "bg-slate-400" : 
                        rank === 3 ? "bg-orange-500" : 
                        "bg-violet-500"
                    } 
                />
            </div>
        </motion.div>
    );
};

const TeamGoalRankingCard = ({ goal }) => {
    const { rankings, loading, metricLabel } = useTeamGoalsRankings(goal);
    
    // Display top 10 only
    const topRankings = rankings.slice(0, 10);

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 flex flex-col h-full">
            <CardHeader className="bg-slate-900 text-white pb-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/30 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl -ml-10 -mb-10" />
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="text-violet-200 border-violet-500/30 bg-violet-500/10 backdrop-blur-sm">
                            <Users className="w-3 h-3 mr-1" /> Equipe
                        </Badge>
                        <div className="flex items-center text-xs text-slate-400 bg-slate-950/30 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(goal.end_date), "dd/MM/yyyy")}
                        </div>
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight">{goal.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Target className="w-3 h-3" />
                        <span>Alvo: <span className="text-violet-300 font-mono">{new Intl.NumberFormat('pt-BR').format(goal.target_value_primary)}</span></span>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="-mt-4 relative z-20 px-4 pb-4 flex-1 flex flex-col">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border p-4 space-y-1 flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            Top 10 Ranking
                        </h4>
                        <span className="text-xs text-slate-400">
                            {rankings.length} participantes
                        </span>
                    </div>
                    
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                        </div>
                    ) : topRankings.length > 0 ? (
                        <div className="space-y-1">
                            {topRankings.map((user) => (
                                <RankingItem 
                                    key={user.distributor_id} 
                                    rank={user.rank} 
                                    user={user} 
                                    metricLabel={metricLabel}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Users className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">Nenhum participante pontuou ainda.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TeamGoalRankingCard;