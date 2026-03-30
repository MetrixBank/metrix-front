import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const GoalsToggle = ({ activeView, onToggle, activeTeamGoalsCount }) => {
    return (
        <div className="relative p-1.5 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/10 flex gap-2 w-full max-w-sm mx-auto shadow-xl ring-1 ring-black/20">
            <button
                onClick={() => onToggle('personal')}
                className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 z-10",
                    activeView === 'personal' ? "text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
            >
                <User className={cn("w-4 h-4", activeView === 'personal' ? "text-white" : "text-slate-500")} />
                <span>Pessoais</span>
                {activeView === 'personal' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
            </button>

            <button
                onClick={() => onToggle('team')}
                className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 z-10",
                    activeView === 'team' ? "text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
            >
                <Users className={cn("w-4 h-4", activeView === 'team' ? "text-white" : "text-slate-500")} />
                <span>Equipe</span>
                
                {activeTeamGoalsCount > 0 && (
                    <Badge className={cn(
                        "h-5 min-w-[1.25rem] px-1 ml-1 flex items-center justify-center shadow-sm border-0 transition-colors",
                        activeView === 'team' ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                    )}>
                        {activeTeamGoalsCount}
                    </Badge>
                )}
                
                {activeView === 'team' && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
            </button>
        </div>
    );
};

export default GoalsToggle;