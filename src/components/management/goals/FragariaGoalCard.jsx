import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain, Loader2, Target, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AnimatedCounter from './AnimatedCounter';

const FragariaGoalCard = () => {
    const { user } = useAuth();
    const [individualPoints, setIndividualPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const participationGoalPoints = 2;
    const isCampaignOver = true; 

    const fetchIndividualPoints = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const startDate = '2025-06-01';
            const endDate = '2025-08-15';
            
            const { data, error } = await supabase.rpc('get_sales_ranking_for_period', { 
                p_start_date: startDate, 
                p_end_date: endDate 
            });

            if (error) throw error;
            
            const currentUserData = data.find(d => d.distributor_id === user.id);
            setIndividualPoints(currentUserData ? currentUserData.total_points : 0);

        } catch (error) {
            toast({ title: "Erro ao buscar seus pontos para Fragária", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchIndividualPoints();
    }, [fetchIndividualPoints]);

    const qualifiedForParticipation = individualPoints >= participationGoalPoints;

    return (
        <Card className="card-gradient shadow-xl border-border/30 overflow-hidden relative">
            {qualifiedForParticipation && isCampaignOver && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
                    className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg z-10"
                >
                    <ShieldCheck className="w-8 h-8" />
                </motion.div>
            )}
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Mountain className="w-8 h-8 text-green-500" />
                    <div>
                        <CardTitle className="text-2xl text-gradient">Missão: Fim de Semana em Fragária</CardTitle>
                        <CardDescription>A campanha foi um sucesso! Veja sua pontuação final.</CardDescription>
                    </div>
                </div>
                 <div className="flex items-center text-sm text-green-400 font-semibold mt-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Campanha Encerrada!
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div>
                            <span className="font-medium text-muted-foreground flex items-center justify-center">
                                <Target className="w-4 h-4 mr-2" />
                                Sua Pontuação Final:
                            </span>
                            <span className="font-bold text-4xl text-primary block">
                                <AnimatedCounter value={individualPoints} formatFunc={(v) => v.toFixed(2)} /> pts
                            </span>
                        </div>
                        
                        {qualifiedForParticipation ? (
                             <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                                <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                                <p className="font-bold text-green-300">Parabéns! Você alcançou a meta e conquistou seu selo!</p>
                             </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center text-center p-3 bg-muted/30 border border-border/30 rounded-lg"
                            >
                                <p className="font-semibold text-muted-foreground">Você chegou perto! Continue assim para as próximas metas.</p>
                             </motion.div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FragariaGoalCard;