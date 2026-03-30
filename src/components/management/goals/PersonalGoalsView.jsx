import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Calendar, BarChart2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const PersonalGoalsView = ({ goals, isLoading, onNewGoal, error }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />)}
            </div>
        );
    }

    if (error) {
         return (
             <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Não foi possível carregar suas metas pessoais.</AlertDescription>
             </Alert>
        );
    }

    if (!goals || goals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-xl">
                <div className="bg-violet-500/10 p-4 rounded-full mb-4 ring-1 ring-violet-500/20">
                    <Target className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma meta ativa</h3>
                <p className="text-slate-400 max-w-sm">
                    Defina objetivos claros para alcançar novos patamares em sua jornada.
                </p>
                <Button 
                    onClick={onNewGoal}
                    className="mt-6 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-medium transition-colors"
                >
                    Criar Primeira Meta
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
                const progress = Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100));
                
                return (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800 shadow-xl hover:shadow-2xl hover:border-violet-500/30 transition-all duration-300 group overflow-hidden relative rounded-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-violet-500/10" />
                            
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-violet-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300 ring-1 ring-violet-500/20">
                                            {goal.type === 'sales' ? (
                                                <BarChart2 className="w-6 h-6 text-violet-400" />
                                            ) : (
                                                <Target className="w-6 h-6 text-violet-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                                                {goal.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="bg-violet-500/5 text-violet-400 border-violet-500/20 text-[10px] uppercase tracking-wider">
                                                    {goal.type === 'sales' ? 'Vendas' : 'Atividade'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-bold text-white tracking-tight">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative pt-2">
                                        <Progress value={progress} className="h-2.5 bg-slate-800" indicatorClassName="bg-gradient-to-r from-violet-600 to-violet-400" />
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs">Atual</span>
                                            <span className="font-semibold text-white">
                                                {goal.metric_type === 'currency' 
                                                    ? formatCurrency(goal.current_value) 
                                                    : Math.round(goal.current_value)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-400 text-xs">Alvo</span>
                                            <span className="font-semibold text-violet-400">
                                                {goal.metric_type === 'currency'
                                                    ? formatCurrency(goal.target_value)
                                                    : Math.round(goal.target_value)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-4 border-t border-slate-800/50">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                            Até {format(new Date(goal.end_date), "d 'de' MMMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default PersonalGoalsView;