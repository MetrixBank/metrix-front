import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const AIAssistantInsights = ({ lead, onAnalyze, className }) => {
    // Determine priority color
    const getPriorityColor = (p) => {
        switch(p?.toLowerCase()) {
            case 'alta': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'média': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'baixa': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    const hasAnalysis = !!lead.ai_analysis_json;
    const analysis = lead.ai_analysis_json;

    return (
        <Card className={cn("bg-slate-900/50 border-indigo-500/30 overflow-hidden", className)}>
            <div className="bg-indigo-900/20 p-2 px-3 border-b border-indigo-500/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-100">Insights IA</span>
                </div>
                {analysis && (
                    <Badge variant="outline" className={cn("text-[10px] h-5 border px-2", getPriorityColor(analysis.priority))}>
                        Prioridade {analysis.priority}
                    </Badge>
                )}
            </div>
            <CardContent className="p-3">
                {hasAnalysis ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-slate-500 block mb-0.5">Classificação</span>
                                <span className="font-medium text-white">{analysis.lead_classification}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block mb-0.5">Intenção</span>
                                <span className="font-medium text-white">{analysis.detected_intention}</span>
                            </div>
                        </div>
                        
                        {analysis.recommended_funnel_stage && (
                            <div className="text-xs bg-slate-950/50 p-2 rounded border border-slate-800">
                                <span className="text-slate-500 mr-1">Recomendação:</span>
                                <span className="text-indigo-300 font-medium">Mover para {analysis.recommended_funnel_stage}</span>
                            </div>
                        )}

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs h-7 mt-1 hover:bg-indigo-500/20 hover:text-indigo-300"
                            onClick={() => onAnalyze(lead)}
                        >
                            Ver Análise Completa <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-xs text-slate-400 mb-2">Sem análise recente</p>
                        <Button 
                            size="sm" 
                            className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 gap-2"
                            onClick={() => onAnalyze(lead)}
                        >
                            <Sparkles className="w-3 h-3" /> Analisar com IA
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AIAssistantInsights;