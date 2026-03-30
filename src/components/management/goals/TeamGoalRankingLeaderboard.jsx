import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Crown } from 'lucide-react';

const RankItem = ({ rank, member, isCurrentUser, metricLabel }) => {
    // Determine rank badge style
    let RankBadge = null;
    let rankColorClass = "bg-slate-700/50 text-slate-400";

    if (rank === 1) {
        RankBadge = <Crown className="w-3.5 h-3.5" />;
        rankColorClass = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
    } else if (rank === 2) {
        RankBadge = <Medal className="w-3.5 h-3.5" />;
        rankColorClass = "bg-slate-300/20 text-slate-300 border border-slate-400/30";
    } else if (rank === 3) {
        RankBadge = <Medal className="w-3.5 h-3.5" />;
        rankColorClass = "bg-orange-400/20 text-orange-400 border border-orange-500/30";
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl mb-2 transition-all duration-300",
                isCurrentUser 
                    ? "bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                    : "bg-slate-800/40 border border-white/5 hover:bg-slate-800/60"
            )}
        >
            {/* Rank Position */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm",
                rankColorClass
            )}>
                {RankBadge || rank}
            </div>

            {/* Avatar */}
            <Avatar className="w-10 h-10 border-2 border-slate-700 shadow-sm">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="text-xs bg-slate-800 text-slate-300 font-bold">
                    {member.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-semibold truncate",
                    isCurrentUser ? "text-purple-300" : "text-slate-200"
                )}>
                    {member.name} {isCurrentUser && <span className="text-xs font-normal opacity-70 ml-1 text-purple-400">(Você)</span>}
                </p>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white tabular-nums tracking-tight">
                    {member.formattedValue} <span className="text-xs text-slate-500 font-medium ml-0.5">{metricLabel}</span>
                </p>
            </div>
        </motion.div>
    );
};

const TeamGoalRankingLeaderboard = ({ rankings, currentUserRank, loading, metricLabel }) => {
    if (loading) {
        return (
            <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                        <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
                        <div className="flex-1 h-4 bg-slate-800 rounded animate-pulse" />
                        <div className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    if (rankings.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-700 opacity-50" />
                Nenhum participante pontuou ainda.
            </div>
        );
    }

    const top10 = rankings.slice(0, 10);
    const isUserInTop10 = currentUserRank && currentUserRank.rank <= 10;

    return (
        <div className="w-full">
            <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
                <Trophy className="w-3.5 h-3.5" /> Ranking da Equipe (Top 10)
            </h4>
            
            <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                    {top10.map((member) => (
                        <RankItem 
                            key={member.distributor_id} 
                            rank={member.rank}
                            member={member}
                            metricLabel={metricLabel}
                            isCurrentUser={currentUserRank?.distributor_id === member.distributor_id}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Show current user separately if not in Top 10 */}
            {!isUserInTop10 && currentUserRank && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                >
                    <div className="flex items-center justify-center my-3 opacity-50">
                        <div className="h-1 w-1 bg-slate-600 rounded-full mx-1" />
                        <div className="h-1 w-1 bg-slate-600 rounded-full mx-1" />
                        <div className="h-1 w-1 bg-slate-600 rounded-full mx-1" />
                    </div>
                    <div className="px-1 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Sua Posição</div>
                    <RankItem 
                        rank={currentUserRank.rank}
                        member={currentUserRank}
                        metricLabel={metricLabel}
                        isCurrentUser={true}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default TeamGoalRankingLeaderboard;