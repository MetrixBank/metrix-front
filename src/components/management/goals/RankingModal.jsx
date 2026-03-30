import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import RankingTable from './RankingTable';
import useGoalRankings from '@/hooks/useGoalRankings';
import { format } from 'date-fns';

const RankingModal = ({ goal, isOpen, onClose }) => {
    const { rankings, loading } = useGoalRankings(goal?.id);

    const handleExport = () => {
        if (!rankings.length) return;
        
        const csvContent = [
            ["Posição", "Nome", "Valor", "Porcentagem"],
            ...rankings.map(r => [
                r.position, 
                r.profiles?.name || 'N/A', 
                r.value, 
                r.percentage + '%'
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ranking_${goal?.name || 'meta'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!goal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-[#1E293B] border-[#334155] text-[#E2E8F0]">
                <DialogHeader className="pb-4 border-b border-[#334155]">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-[#E2E8F0]">
                                {goal.name}
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex gap-2 items-center text-[#94A3B8]">
                                <span>{goal.description}</span>
                                <span className="text-xs bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                                    {format(new Date(goal.start_date), "dd/MM/yyyy")} até {format(new Date(goal.end_date), "dd/MM/yyyy")}
                                </span>
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExport} className="bg-transparent text-[#E2E8F0] border-[#334155] hover:bg-[#334155]">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <RankingTable rankings={rankings} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RankingModal;