import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
    Sparkles, Copy, CheckCircle, AlertTriangle, 
    MessageSquare, Tag, ArrowRight, ThumbsUp, ThumbsDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const AIAssistantPanel = ({ 
    isOpen, 
    onClose, 
    lead, 
    analysis, 
    isLoading, 
    onAcceptSuggestion, 
    onCopyMessage 
}) => {
    const [messageTone, setMessageTone] = useState('casual');
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const getPriorityColor = (p) => {
        switch(p?.toLowerCase()) {
            case 'alta': return 'bg-red-500 text-white border-red-600';
            case 'média': return 'bg-amber-500 text-white border-amber-600';
            case 'baixa': return 'bg-blue-500 text-white border-blue-600';
            default: return 'bg-slate-500 text-white';
        }
    };

    const handleFeedback = (helpful) => {
        setFeedbackGiven(true);
        // Here you would typically log this to the DB
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] border-l-slate-800 bg-slate-950 text-white p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-6 bg-slate-900/50 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Assistente Inteligente</span>
                    </div>
                    <SheetTitle className="text-white text-xl">Análise de Lead</SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Insights gerados para {lead?.name || 'este contato'}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
                        </div>
                        <p className="text-slate-400 text-sm animate-pulse">Analisando histórico e perfil...</p>
                    </div>
                ) : analysis ? (
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <span className="text-xs text-slate-500 block mb-1">Classificação</span>
                                    <div className="font-bold text-lg">{analysis.lead_classification}</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <span className="text-xs text-slate-500 block mb-1">Prioridade</span>
                                    <Badge className={cn("text-xs font-bold", getPriorityColor(analysis.priority))}>
                                        {analysis.priority}
                                    </Badge>
                                </div>
                            </div>

                            {/* Intention & Risk */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300 mb-2">Intenção Detectada</h4>
                                    <p className="text-sm text-white bg-slate-900 p-3 rounded-md border border-slate-800">
                                        {analysis.detected_intention}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        Avaliação de Risco
                                    </h4>
                                    <p className="text-sm text-slate-300 bg-amber-950/20 p-3 rounded-md border border-amber-900/30">
                                        {analysis.risk_assessment}
                                    </p>
                                </div>
                            </div>

                            <Separator className="bg-slate-800" />

                            {/* Suggested Actions */}
                            <div>
                                <h4 className="text-sm font-medium text-indigo-400 mb-3 uppercase tracking-wider">Ações Recomendadas</h4>
                                
                                {/* Funnel Stage */}
                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs text-slate-500">Mover para fase</span>
                                            <div className="font-bold text-white capitalize">{analysis.recommended_funnel_stage}</div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-7 text-xs"
                                            onClick={() => onAcceptSuggestion(lead.id, 'stage', analysis.recommended_funnel_stage)}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" /> Aplicar
                                        </Button>
                                    </div>
                                </div>

                                {/* Message Suggestions */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" /> Sugestão de Resposta
                                        </span>
                                        <div className="flex bg-slate-900 rounded-md p-1 border border-slate-800">
                                            {['formal', 'casual', 'urgent'].map((tone) => (
                                                <button
                                                    key={tone}
                                                    onClick={() => setMessageTone(tone)}
                                                    className={cn(
                                                        "px-2 py-1 text-[10px] rounded capitalize transition-all",
                                                        messageTone === tone 
                                                            ? "bg-indigo-600 text-white shadow-sm" 
                                                            : "text-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    {tone === 'urgent' ? 'Urgente' : tone}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 relative group">
                                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {analysis.suggested_message?.[messageTone]}
                                        </p>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700"
                                            onClick={() => onCopyMessage(analysis.suggested_message?.[messageTone])}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Tag className="w-4 h-4" /> Tags Sugeridas
                                    </h4>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 text-[10px]"
                                        onClick={() => onAcceptSuggestion(lead.id, 'tags', analysis.suggested_tags)}
                                    >
                                        Adicionar Todas
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.suggested_tags?.map((tag, i) => (
                                        <Badge key={i} variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Next Steps List */}
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Próximos Passos</h4>
                                <ul className="space-y-2">
                                    {analysis.next_steps?.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Feedback */}
                            {!feedbackGiven && (
                                <div className="flex justify-center items-center gap-4 pt-4">
                                    <span className="text-xs text-slate-500">Essa análise foi útil?</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700" onClick={() => handleFeedback(true)}>
                                            <ThumbsUp className="w-3 h-3 text-green-500" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-700" onClick={() => handleFeedback(false)}>
                                            <ThumbsDown className="w-3 h-3 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <p>Nenhuma análise disponível.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default AIAssistantPanel;