import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageSquare, Edit2, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const ContactExtractionCard = ({ contact }) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { toast } = useToast();
    
    // Confidence Helpers
    const getConfidenceColor = (score) => {
        if (score >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-200";
        if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-500 bg-red-50 border-red-200";
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: text });
    };

    if (!contact) return null;

    return (
        <Card className="w-full max-w-md border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2 pt-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{contact.name}</h3>
                            <span 
                                className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-1", getConfidenceColor(contact.confidence_score))}
                                title={`Score de Confiança: ${contact.confidence_score}%`}
                            >
                                {contact.confidence_score >= 80 ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {contact.confidence_score}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => copyToClipboard(contact.phone)}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8">
                        <Edit2 className="h-3 w-3 mr-2" />
                        Editar
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="pb-3">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm italic text-slate-700 dark:text-slate-300">
                                "{contact.last_message}"
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-2 text-right">
                                {contact.last_message_date && format(new Date(contact.last_message_date), 'dd/MM/yyyy')} 
                                {' '}
                                {contact.last_message_time && contact.last_message_time.substring(0, 5)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Suggested Stage based on extraction metadata if available */}
                {contact.extraction_metadata?.message?.analysis?.stage_suggestion && (
                     <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Sugestão de Fase:</span>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                            {contact.extraction_metadata.message.analysis.stage_suggestion}
                        </Badge>
                     </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 flex flex-col items-stretch">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-muted-foreground hover:text-foreground text-xs h-8"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                    {isHistoryOpen ? 'Ocultar Histórico' : 'Ver Histórico'}
                    {isHistoryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                
                {isHistoryOpen && (
                    <div className="mt-2 space-y-2 border-t pt-2 animate-in slide-in-from-top-2 duration-200">
                         {/* Mock history or fetch real history from message_history table */}
                         <div className="text-center py-2 text-xs text-muted-foreground">
                             Carregando histórico...
                             {/* In real implementation, map message_history here */}
                         </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default ContactExtractionCard;