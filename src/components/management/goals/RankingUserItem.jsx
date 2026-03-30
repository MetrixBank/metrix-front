import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatGoalValue } from '@/lib/utils';
import { Crown, Medal } from 'lucide-react';

const RankingUserItem = ({ user, position, isCurrentUser }) => {
    let positionBadge = null;
    const rankingType = user.rankingType || 'points';
    
    if (position === 1) {
        positionBadge = <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-1 shadow-md z-10"><Crown className="w-3 h-3" /></div>;
    } else if (position === 2) {
        positionBadge = <div className="absolute -top-1 -right-1 bg-slate-300 text-slate-800 rounded-full p-1 shadow-md z-10"><Medal className="w-3 h-3" /></div>;
    } else if (position === 3) {
        positionBadge = <div className="absolute -top-1 -right-1 bg-amber-600 text-amber-100 rounded-full p-1 shadow-md z-10"><Medal className="w-3 h-3" /></div>;
    }

    const getTextColors = () => {
        if (rankingType === 'revenue') return isCurrentUser ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400';
        if (rankingType === 'tokens') return isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400';
        return isCurrentUser ? 'text-purple-700 dark:text-purple-300' : 'text-purple-600 dark:text-purple-400';
    };

    const valueColor = getTextColors();
    const formattedValue = formatGoalValue(user.value || 0, rankingType);
    const [valNum, valUnit] = formattedValue.split(' '); // Basic split, works with simple formatGoalValue

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: position * 0.05 }}
            whileHover={{ scale: 1.02, backgroundColor: isCurrentUser ? 'rgba(var(--bg-highlight), 0.15)' : 'rgba(255, 255, 255, 0.8)' }}
            className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 border border-transparent hover:shadow-lg backdrop-blur-sm",
                isCurrentUser 
                    ? cn("shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-1", 
                        rankingType === 'revenue' ? "bg-emerald-500/10 border-emerald-500/20 ring-emerald-500/30" : 
                        rankingType === 'tokens' ? "bg-blue-500/10 border-blue-500/20 ring-blue-500/30" : 
                        "bg-purple-500/10 border-purple-500/20 ring-purple-500/30") 
                    : "bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800"
            )}
        >
            {/* Position */}
            <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 shadow-sm",
                position === 1 ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900" :
                position === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900" :
                position === 3 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
                {position}
            </div>

            {/* Avatar */}
            <div className="relative">
                <Avatar className={cn("w-12 h-12 border-2 shadow-sm", 
                    isCurrentUser 
                        ? (rankingType === 'revenue' ? "border-emerald-500" : rankingType === 'tokens' ? "border-blue-500" : "border-purple-500") 
                        : "border-white dark:border-slate-700"
                )}>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className={cn("font-bold", 
                        rankingType === 'revenue' ? "bg-emerald-100 text-emerald-700" :
                        rankingType === 'tokens' ? "bg-blue-100 text-blue-700" :
                        "bg-purple-100 text-purple-700"
                    )}>
                        {user.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {positionBadge}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={cn("font-semibold truncate text-sm", isCurrentUser ? valueColor : "text-slate-800 dark:text-slate-200")}>
                        {user.name}
                    </p>
                    {isCurrentUser && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", 
                        rankingType === 'revenue' ? "bg-emerald-100 text-emerald-700" :
                        rankingType === 'tokens' ? "bg-blue-100 text-blue-700" :
                        "bg-purple-100 text-purple-700"
                    )}>Você</span>}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={cn("text-xl font-bold", valueColor)}>
                        {rankingType === 'revenue' ? formatGoalValue(user.value || 0, rankingType) : Number(user.value || 0).toLocaleString('pt-BR')}
                    </span>
                    {rankingType !== 'revenue' && (
                        <span className="text-xs text-slate-400 font-medium">{rankingType === 'tokens' ? 'tokens' : 'pts'}</span>
                    )}
                </div>
            </div>
            
            {/* Trend Indicator (Optional visual flair) */}
            {position <= 3 && (
                <div className="hidden sm:block">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
            )}
        </motion.div>
    );
};

export default RankingUserItem;