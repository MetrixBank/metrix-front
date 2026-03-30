import React, { useState } from 'react';
import { Trophy, Save, DollarSign, ShoppingBag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const RANK_OPTIONS = [
    "Distribuidor", "Master", "Executivo", "Safira", "Rubi", 
    "Duplo Rubi", "Diamante", "Duplo Diamante", "Triplo Diamante", 
    "Brilhante", "Brilhante Presidente"
];

const DistributorDetailsPanel = ({ node, onUpdate }) => {
    const { toast } = useToast();
    const [selectedRank, setSelectedRank] = useState(node.distributor_type || 'Distribuidor');
    const [loadingRank, setLoadingRank] = useState(false);

    const handleRankUpdate = async () => {
        setLoadingRank(true);
        try {
            // Use the proper DB update call
            const { error } = await supabase.rpc('update_distributor_rank', {
                p_target_user_id: node.id, 
                p_new_rank: selectedRank
            });

            if (error) throw error;

            toast({
                title: "Classificação Atualizada",
                description: `O nível de ${node.name} foi atualizado para ${selectedRank}.`,
                className: "bg-green-600 text-white border-none"
            });

            // Trigger a refresh of the parent data to reflect changes in the tree
            if (onUpdate) onUpdate();

        } catch (error) {
            console.error("Error updating rank:", error);
            toast({
                title: "Erro ao atualizar",
                description: error.message || "Não foi possível alterar a classificação.",
                variant: "destructive"
            });
        } finally {
            setLoadingRank(false);
        }
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Rank Management */}
                <div className="bg-background p-5 rounded-xl border shadow-sm space-y-4 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <div className="p-1.5 bg-yellow-100 rounded-full">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-sm">Classificação de Carreira</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nível Atual</Label>
                            <Select 
                                value={selectedRank} 
                                onValueChange={setSelectedRank}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Selecione o nível" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RANK_OPTIONS.map(rank => (
                                        <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button 
                            className="w-full" 
                            onClick={handleRankUpdate}
                            disabled={loadingRank}
                        >
                            {loadingRank ? (
                                <span className="animate-pulse">Salvando...</span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Salvar Classificação
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Side: Stats */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10 shadow-sm h-full">
                        <CardContent className="p-5 flex flex-row items-center justify-between h-full">
                            <div>
                                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Total Vendas</span>
                                <p className="text-3xl font-bold text-primary mt-1">{node.stats.totalSales}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-full">
                                <ShoppingBag className="w-6 h-6 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm h-full">
                        <CardContent className="p-5 flex flex-row items-center justify-between h-full">
                            <div>
                                <span className="text-[10px] uppercase text-green-700/70 font-bold tracking-wider">Receita Total</span>
                                <p className="text-2xl font-bold text-green-700 mt-1 truncate" title={formatCurrency(node.stats.totalRevenue)}>
                                    {formatCurrency(node.stats.totalRevenue)}
                                </p>
                            </div>
                             <div className="p-3 bg-green-200/50 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-700" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DistributorDetailsPanel;