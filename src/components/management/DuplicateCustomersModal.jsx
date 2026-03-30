import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Users, X, CheckCircle2 } from 'lucide-react';
import { MergeCustomersInterface } from './MergeCustomersInterface';
import { mergeCustomerData } from '@/lib/customerDeduplication';
import { toast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

export const DuplicateCustomersModal = ({ duplicateGroups, onRefresh, isOpen, onClose }) => {
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
    const [isMerging, setIsMerging] = useState(false);

    // Filter out groups that might have been processed locally if parent didn't refresh yet
    const activeGroups = duplicateGroups; 

    const handleMerge = async (primaryId, duplicateIds, finalData) => {
        setIsMerging(true);
        try {
            // Call Supabase RPC
            const { data, error } = await supabase.rpc('merge_customers_atomic', {
                primary_id: primaryId,
                duplicate_ids: duplicateIds,
                final_data: finalData
            });

            if (error) throw error;

            toast({
                title: "Mesclagem Concluída",
                description: `Sucesso! Registros unificados.`,
                className: "bg-emerald-500 border-none text-white"
            });

            // Close merge interface
            setSelectedGroupIndex(null);
            
            // Trigger refresh in parent
            if (onRefresh) onRefresh();

        } catch (error) {
            console.error("Merge error:", error);
            toast({
                title: "Erro na mesclagem",
                description: "Não foi possível completar a ação. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/50">
                <AnimatePresence mode="wait">
                    {selectedGroupIndex !== null ? (
                        <motion.div 
                            key="interface"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full h-full flex items-center justify-center p-4"
                        >
                            <MergeCustomersInterface 
                                duplicateGroup={activeGroups[selectedGroupIndex]}
                                onMerge={handleMerge}
                                onCancel={() => setSelectedGroupIndex(null)}
                                isMerging={isMerging}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Layers className="text-amber-500" />
                                        Gerenciar Duplicatas
                                    </h2>
                                    <p className="text-muted-foreground">
                                        Encontramos {activeGroups.length} grupos de clientes similares.
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onClose(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeGroups.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
                                        <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500" />
                                        <p className="text-lg font-medium">Tudo limpo!</p>
                                        <p>Não encontramos clientes duplicados na sua carteira.</p>
                                    </div>
                                ) : (
                                    activeGroups.map((group, idx) => (
                                        <div 
                                            key={idx} 
                                            className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                            onClick={() => setSelectedGroupIndex(idx)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                                                    {group.length} Registros
                                                </Badge>
                                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                                    Resolver
                                                </Button>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {group.slice(0, 3).map(c => (
                                                    <div key={c.id} className="flex items-center gap-3 text-sm">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium truncate">{c.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {c.phone || c.email || 'Sem contato'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {group.length > 3 && (
                                                    <p className="text-xs text-center text-muted-foreground pt-1">
                                                        + {group.length - 3} outros
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};