import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalGoalsManager from './PersonalGoalsManager';
import TeamGoalsDisplay from './TeamGoalsDisplay';
import { Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import useTeamGoals from '@/hooks/useTeamGoals';
import { Skeleton } from '@/components/ui/skeleton';

const GoalsTab = () => {
    // We check for manager status here to conditionally render the tab trigger
    const { hasManager, loading: teamLoading } = useTeamGoals();

    return (
        <div className="w-full space-y-6">
            <Tabs defaultValue="personal" className="w-full">
                <div className="flex items-center justify-center mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-muted p-1 rounded-xl">
                        <TabsTrigger 
                            value="personal" 
                            className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                        >
                            <Target className="w-4 h-4 text-violet-500" /> Minhas Metas
                        </TabsTrigger>
                        
                        {teamLoading ? (
                            <div className="flex items-center justify-center w-full">
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ) : hasManager ? (
                            <TabsTrigger 
                                value="team" 
                                className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                            >
                                <Users className="w-4 h-4 text-violet-500" /> Metas em Equipe
                            </TabsTrigger>
                        ) : (
                            <div className="flex items-center justify-center text-xs text-muted-foreground/50 cursor-not-allowed select-none">
                                <Users className="w-3 h-3 mr-1" /> Equipe (Indisponível)
                            </div>
                        )}
                    </TabsList>
                </div>

                <div className="min-h-[500px]">
                    <TabsContent value="personal" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <PersonalGoalsManager />
                        </motion.div>
                    </TabsContent>
                    
                    {hasManager && (
                        <TabsContent value="team" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <TeamGoalsDisplay />
                            </motion.div>
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default GoalsTab;