import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Zap, MessageSquare, Tag, ShieldCheck } from 'lucide-react';

const AIDocumentationModal = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-slate-950 text-white border-slate-800">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <DialogTitle className="text-2xl">Guia do Assistente IA</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Aprenda como utilizar a inteligência artificial para potencializar suas vendas.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-8 py-4">
                        
                        <section>
                            <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                                <Zap className="w-5 h-5" /> O que é?
                            </h3>
                            <p className="text-slate-300 leading-relaxed">
                                O Assistente IA analisa seus leads em tempo real, lendo o histórico de mensagens e perfil do cliente para sugerir as melhores ações. Ele atua como um copiloto de vendas, ajudando você a priorizar quem está pronto para comprar.
                            </p>
                        </section>

                        <section className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-400" /> Respostas Inteligentes
                                </h4>
                                <p className="text-sm text-slate-400">
                                    Gera 3 variações de resposta (Formal, Casual, Urgente) baseadas no contexto da conversa, prontas para copiar e enviar.
                                </p>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-amber-400" /> Classificação Automática
                                </h4>
                                <p className="text-sm text-slate-400">
                                    Define automaticamente se o lead é "Quente", "Morno" ou "Frio" e sugere a movimentação correta no funil de vendas.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> Melhores Práticas
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-300">
                                <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">1.</span>
                                    <span>Sempre revise as sugestões antes de aceitar. A IA é uma ferramenta de apoio, mas você conhece seu cliente melhor.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">2.</span>
                                    <span>Use o tom "Urgente" com moderação, apenas para clientes classificados como "Alta Prioridade" ou com intenção de "Compra Imediata".</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">3.</span>
                                    <span>O sistema aprende com o tempo. Utilize os botões de feedback (👍/👎) para melhorar as recomendações futuras.</span>
                                </li>
                            </ul>
                        </section>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AIDocumentationModal;