import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Calendar, Target, Loader2 } from 'lucide-react';
import useAdminJourneyData from '@/components/admin/journey/hooks/useAdminJourneyData';
import AnimatedCounter from './AnimatedCounter';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TeamMonthlyRevenueCard = () => {
    const { kpiData, loading } = useAdminJourneyData('team'); // Fetch for 'team' distributors
    const { currentMonthRevenue = 0, lastMonthRevenue = 0 } = kpiData || {};
    const monthlyTarget = 150000;
    const currentMonthProgress = currentMonthRevenue > 0 ? (currentMonthRevenue / monthlyTarget) * 100 : 0;
    const lastMonthProgress = lastMonthRevenue > 0 ? (lastMonthRevenue / monthlyTarget) * 100 : 0;
    
    const now = new Date();
    const currentMonthName = format(now, 'MMMM', { locale: ptBR });
    const lastMonthName = format(subMonths(now, 1), 'MMMM', { locale: ptBR });

    return (
        <Card className="card-gradient shadow-xl border-border/30 overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg text-gradient flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                    Faturamento Mensal da Equipe
                </CardTitle>
                <p className="text-sm text-muted-foreground">Performance dos distribuidores da Equipe GSP.</p>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center p-4 h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-foreground flex items-center capitalize">
                                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground"/>
                                    {currentMonthName} (Atual)
                                </span>
                                <span className="font-bold text-primary">
                                    <AnimatedCounter value={currentMonthRevenue} formatFunc={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                </span>
                            </div>
                            <Progress value={currentMonthProgress} indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-500" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-foreground flex items-center capitalize">
                                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground"/>
                                    {lastMonthName}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                    <AnimatedCounter value={lastMonthRevenue} formatFunc={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                </span>
                            </div>
                            <Progress value={lastMonthProgress} indicatorClassName="bg-gray-500" />
                        </div>
                        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/20">
                            <Target className="inline-block w-4 h-4 mr-2" />
                            Meta Mensal: R$ 150.000,00
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TeamMonthlyRevenueCard;