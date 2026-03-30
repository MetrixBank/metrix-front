import React from 'react';
import RankingUserItem from './RankingUserItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RankingList = ({ participants, currentUserId }) => {
    // Participants should already have 'value' and 'rankingType' populated by useGoalParticipants
    // But we re-sort here just to be safe if prop updates are async
    const sortedParticipants = [...participants].sort((a, b) => (b.value || 0) - (a.value || 0));
    const topParticipants = sortedParticipants.slice(0, 10); // Limit to top 10

    return (
        <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 h-full flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Ranking da Equipe</h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {sortedParticipants.length} Top 10
                        </span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 pb-4">
                    {topParticipants.length > 0 ? (
                        topParticipants.map((user, index) => (
                            <RankingUserItem 
                                key={user.userId || user.id} 
                                user={user} 
                                position={index + 1} 
                                isCurrentUser={user.userId === currentUserId || user.id === currentUserId}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
                            <Trophy className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">Nenhum participante pontuou ainda.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            {/* Show user's rank if not in top 10 */}
            {(() => {
                const userIndex = sortedParticipants.findIndex(u => (u.userId === currentUserId || u.id === currentUserId));
                if (userIndex >= 10) {
                    const user = sortedParticipants[userIndex];
                    return (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]"
                        >
                            <p className="text-xs text-center text-slate-400 uppercase font-bold tracking-wider mb-2">Sua Posição</p>
                            <RankingUserItem 
                                user={user} 
                                position={userIndex + 1} 
                                isCurrentUser={true} 
                            />
                        </motion.div>
                    );
                }
                return null;
            })()}
        </div>
    );
};

export default RankingList;