import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Award, Loader2, Target } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import useAdminJourneyData from '@/components/admin/journey/hooks/useAdminJourneyData';
import { Progress } from '@/components/ui/progress';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
    },
};

const TeamRevenueGoalCard = () => {
    const { kpiData, loading, error } = useAdminJourneyData('team');
    const annualJourneyTotal = kpiData?.annualJourneyTotal || 0;
    const annualTarget = 1880000;
    const progress = annualJourneyTotal > 0 ? (annualJourneyTotal / annualTarget) * 100 : 0;

    return (
        <motion.div variants={cardVariants}>
            <Card className="card-gradient shadow-lg border-border/30 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg text-gradient flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-400" />
                        Faturamento Anual da Equipe
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Jornada anual de toda a equipe GSP.</p>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center p-4 h-24">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
                            Erro ao carregar os dados.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center space-y-1">
                                <p className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
                                    <AnimatedCounter value={annualJourneyTotal} formatFunc={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                </p>
                                <p className="text-sm font-medium text-muted-foreground">Total acumulado este ano</p>
                            </div>
                             <div className="space-y-2">
                                <Progress value={progress} indicatorClassName="bg-gradient-to-r from-amber-400 to-yellow-500" />
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="font-semibold">Progresso</span>
                                    <div className="flex items-center font-semibold">
                                        <Target className="w-3 h-3 mr-1.5 text-amber-500" />
                                        <span>Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualTarget)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TeamRevenueGoalCard;