import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Trophy, AlertCircle, Loader2 } from 'lucide-react';
import TeamGoalRankingCard from './TeamGoalRankingCard';
import TeamGoalsList from './TeamGoalsList';
import useTeamGoalsData from '@/hooks/useTeamGoalsData';
import { useDataSync } from '@/contexts/DataSyncContext';
import { motion, AnimatePresence } from 'framer-motion';

const GeneralGoalsView = () => {
    const { syncKey } = useDataSync();
    const { goals, loading, error, refetch } = useTeamGoalsData(syncKey);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // Auto-select first goal when loaded
    useEffect(() => {
        if (goals.length > 0 && !selectedGoal) {
            setSelectedGoal(goals[0]);
        }
    }, [goals]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                <p>Carregando competições...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-400">
                <AlertCircle className="w-10 h-10 mb-4" />
                <p>Erro ao carregar metas da equipe.</p>
                <button onClick={refetch} className="mt-4 text-sm underline hover:text-white">Tentar novamente</button>
            </div>
        );
    }

    if (goals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-6xl mx-auto min-h-[50vh]">
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full mb-6 ring-1 ring-indigo-500/20 animate-pulse">
                    <Trophy className="w-16 h-16 text-indigo-500" />
                </div>
                <h3 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Sem Campanhas Ativas</h3>
                <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
                    No momento não há competições ativas para sua equipe. Fique atento às novidades!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                
                {/* Left Side: Goals List */}
                <div className="w-full xl:w-1/3 xl:min-w-[350px] overflow-y-auto custom-scrollbar pr-2">
                     <TeamGoalsList 
                        goals={goals} 
                        selectedGoalId={selectedGoal?.id}
                        onSelectGoal={setSelectedGoal}
                     />
                </div>

                {/* Right Side: Detailed Ranking View */}
                <div className="w-full xl:w-2/3 h-full">
                    <AnimatePresence mode="wait">
                        {selectedGoal ? (
                            <motion.div
                                key={selectedGoal.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <TeamGoalRankingCard goal={selectedGoal} />
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <p>Selecione uma competição para ver detalhes</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default GeneralGoalsView;