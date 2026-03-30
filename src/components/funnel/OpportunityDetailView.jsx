import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useSugestoesResposta } from '@/hooks/useSugestoesResposta';
import { Loader2, Copy, Send, MessageSquare, History, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OpportunityDetailView = ({ opportunity, onClose }) => {
    const [interactions, setInteractions] = useState([]);
    const [history, setHistory] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const { sugestao, loading: loadingSugg } = useSugestoesResposta(opportunity.id);

    // If opportunity passed from list view doesn't have lead info fully populated, handle gracefully
    // But useOportunidades populates it.
    const lead = opportunity.leads || {};

    useEffect(() => {
        const fetchDetails = async () => {
            setLoadingDetails(true);
            
            // Fetch interactions
            const { data: inters } = await supabase
                .from('interacoes')
                .select('*')
                .eq('lead_id', opportunity.lead_id)
                .order('data', { ascending: false });
            setInteractions(inters || []);

            // Fetch history
            const { data: hist } = await supabase
                .from('historico_funil')
                .select('*')
                .eq('oportunidade_id', opportunity.id)
                .order('data', { ascending: false });
            setHistory(hist || []);

            setLoadingDetails(false);
        };

        fetchDetails();

        // Realtime for new messages
        const channel = supabase
            .channel(`details_${opportunity.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interacoes', filter: `lead_id=eq.${opportunity.lead_id}` }, 
                () => { /* simplified refresh: fetchDetails() could be called */ })
            .subscribe();

        return () => supabase.removeChannel(channel);

    }, [opportunity.id, opportunity.lead_id]);

    const handleCopy = () => {
        if (sugestao?.sugestao) navigator.clipboard.writeText(sugestao.sugestao);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <Card className="w-full max-w-5xl h-[90vh] flex flex-col bg-slate-950 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4 flex flex-row justify-between items-center bg-slate-900/50">
                    <div>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                            {lead.nome || 'Lead'}
                            <Badge variant="secondary" className="text-xs font-normal">{opportunity.etapa}</Badge>
                        </CardTitle>
                        <CardDescription className="text-slate-400 flex gap-4 mt-1">
                            <span>{lead.telefone}</span>
                            <span>Probabilidade: {opportunity.probabilidade}%</span>
                            <span>Valor: R$ {opportunity.valor_estimado || 0}</span>
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </CardHeader>
                
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Chat & Interactions */}
                    <div className="flex-1 flex flex-col border-r border-slate-800">
                        <div className="p-3 border-b border-slate-800 bg-slate-900/30 text-xs font-bold text-slate-500 uppercase">
                            Histórico de Conversa
                        </div>
                        <ScrollArea className="flex-1 p-4 bg-slate-950">
                            {loadingDetails ? <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" /> : (
                                <div className="space-y-4">
                                    {interactions.length === 0 && <p className="text-center text-slate-500">Sem interações.</p>}
                                    {interactions.map((msg) => (
                                        <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.tipo === 'entrada' ? 'self-start' : 'self-end items-end ml-auto'}`}>
                                            <div className={`p-3 rounded-xl text-sm ${msg.tipo === 'entrada' ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                                                {msg.mensagem}
                                            </div>
                                            <span className="text-[10px] text-slate-600 mt-1">
                                                {format(new Date(msg.data), "dd/MM HH:mm", { locale: ptBR })} • {msg.canal}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        
                        {/* Suggestion Area */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" /> Sugestão Inteligente
                                </h4>
                                {sugestao && (
                                    <Badge variant="outline" className="text-[10px] h-5 border-purple-500/30 text-purple-300">
                                        {sugestao.taxa_sucesso}% Sucesso
                                    </Badge>
                                )}
                             </div>
                             {loadingSugg ? <Loader2 className="w-4 h-4 animate-spin" /> : sugestao ? (
                                <div className="space-y-2">
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-slate-300 italic">
                                        {sugestao.sugestao}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleCopy}>
                                            <Copy className="w-3 h-3 mr-1" /> Copiar
                                        </Button>
                                        <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700">
                                            <Send className="w-3 h-3 mr-1" /> Usar
                                        </Button>
                                    </div>
                                </div>
                             ) : <p className="text-xs text-slate-500">Nenhuma sugestão disponível.</p>}
                        </div>
                    </div>

                    {/* Right: History & Actions */}
                    <div className="w-full md:w-80 bg-slate-900/20 p-4 overflow-y-auto">
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <History className="w-3 h-3" /> Linha do Tempo
                            </h4>
                            <div className="space-y-4 relative border-l-2 border-slate-800 ml-1.5 pl-4">
                                {history.map((h, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[21px] top-0 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-900"></div>
                                        <p className="text-xs font-bold text-white capitalize">{h.etapa_nova.replace('_', ' ')}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{h.motivo}</p>
                                        <p className="text-[10px] text-slate-600 mt-1">{format(new Date(h.data), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Avançar Manualmente</h4>
                             <Textarea placeholder="Motivo da mudança..." className="bg-slate-950 border-slate-800 mb-2 h-20 text-xs" />
                             <Button className="w-full text-xs">Atualizar Etapa</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default OpportunityDetailView;