import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const GoalProgressCard = ({ goal, onShowRanking }) => {
    const target = goal.target_value_primary || 0;
    const current = goal.current_value || 0; 
    const percentage = target > 0 ? (current / target) * 100 : 0;
    
    const getProgressColor = (percent) => {
        if (percent >= 80) return "bg-emerald-500";
        if (percent >= 50) return "bg-amber-500";
        return "bg-red-500";
    };

    const progressColor = getProgressColor(percentage);

    return (
        <Card className="hover:shadow-md transition-shadow duration-300 overflow-hidden border-l-4 border-l-primary bg-[#1E293B] border-[#334155] text-[#E2E8F0]">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold text-[#E2E8F0] line-clamp-1">
                            {goal.name}
                        </CardTitle>
                        <p className="text-sm text-[#94A3B8] mt-1 line-clamp-2 h-10">
                            {goal.description || "Sem descrição definida."}
                        </p>
                    </div>
                    <Badge variant={goal.is_active ? "default" : "secondary"} className="bg-[#0F172A] text-[#94A3B8] border-[#334155]">
                        {goal.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Values */}
                    <div className="flex justify-between items-end text-sm">
                        <div>
                            <span className="text-[#94A3B8]">Alvo:</span>
                            <span className="ml-2 font-bold text-base text-[#E2E8F0]">{target.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="text-right">
                             <span className={cn("font-bold text-lg", percentage >= 100 ? "text-emerald-400" : "text-blue-400")}>
                                {percentage.toFixed(1)}%
                             </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 w-full bg-[#0F172A] rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full transition-all duration-500 rounded-full", progressColor)}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#334155] mt-4">
                        <div className="flex flex-col text-xs text-[#64748B] gap-1">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {format(new Date(goal.start_date), "dd/MM", { locale: ptBR })} - {format(new Date(goal.end_date), "dd/MM", { locale: ptBR })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                <span>Atualizado hoje</span>
                            </div>
                        </div>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 bg-transparent text-[#94A3B8] border-[#334155] hover:bg-[#334155] hover:text-[#E2E8F0]"
                            onClick={() => onShowRanking(goal)}
                        >
                            <Trophy className="h-4 w-4" />
                            Ver Ranking
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GoalProgressCard;