import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Zap, AlertTriangle, TrendingUp, ChevronRight, BrainCircuit, Target } from 'lucide-react';
import { colors } from '@/lib/chartColorScheme';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const InsightCard = ({ type, title, description, value, score, colorClass }) => (
    <div className={cn("p-3 rounded-lg border bg-white/5 hover:bg-white/10 transition-all cursor-pointer group", colorClass)}>
        <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">{type}</span>
            {score && <Badge variant="secondary" className="text-[10px] h-5 bg-white/10">Score: {score}</Badge>}
        </div>
        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{title}</h4>
        <div className="flex justify-between items-end">
             <p className="text-xs text-slate-400 line-clamp-2 max-w-[70%]">{description}</p>
             {value && <span className="text-sm font-mono font-bold text-emerald-400">{value}</span>}
        </div>
    </div>
);

const SalesCopilotWidget = ({ insights }) => {
    return (
        <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-white/10 shadow-xl overflow-hidden relative">
             {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10 transform -translate-x-1/3 translate-y-1/3"></div>

            <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                             <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-white">Copiloto de Vendas</CardTitle>
                            <CardDescription className="text-xs text-indigo-300 flex items-center gap-1">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                </span>
                                Análise em tempo real ativa
                            </CardDescription>
                        </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-slate-400 hover:text-white">
                        Ver Análise Completa <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
                {/* 1. Strategic Recommendations */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-emerald-400" /> Recomendações Estratégicas
                    </h3>
                    <div className="grid gap-2">
                        {insights.recommendations.slice(0, 2).map((rec, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn("p-3 rounded-md border-l-4 bg-white/5", 
                                    rec.type === 'critical' ? "border-l-red-500" : "border-l-emerald-500"
                                )}
                            >
                                <p className="text-sm text-slate-200">{rec.text}</p>
                                <div className="mt-2 flex gap-2">
                                    <Button size="xs" variant="secondary" className="h-6 text-[10px] bg-white/10 hover:bg-white/20 text-white border-0">
                                        Aplicar Ação
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 2. Hot Opportunities Grid */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" /> Oportunidades Quentes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {insights.hotOpportunities.slice(0, 4).map((opp, i) => (
                             <InsightCard 
                                key={i}
                                type="Oportunidade"
                                title={opp.customer}
                                description={`Probabilidade: ${opp.probability}% • Fecha em: ${opp.expectedDate}`}
                                value={`R$ ${(opp.value / 1000).toFixed(1)}k`}
                                score={opp.probability}
                                colorClass="border-amber-500/30 hover:border-amber-500/50"
                             />
                        ))}
                    </div>
                </div>

                {/* 3. Risks */}
                 <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> Riscos Detectados
                    </h3>
                    {insights.risks.slice(0, 1).map((risk, i) => (
                         <div key={i} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-300">Atenção Necessária</h4>
                                <p className="text-xs text-red-200/80 mt-1">{risk.text}</p>
                            </div>
                         </div>
                    ))}
                </div>

            </CardContent>
        </Card>
    );
};

export default SalesCopilotWidget;