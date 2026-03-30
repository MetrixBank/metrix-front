import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatGoalValue } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const RankingTable = ({ rankings, loading, goalTarget }) => {
    if (loading) {
        return (
             <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full bg-[#334155]" />)}
             </div>
        );
    }

    if (rankings.length === 0) {
        return (
            <div className="text-center py-8 text-[#94A3B8] text-sm bg-[#0F172A] rounded-lg border border-[#334155]">
                Nenhum participante pontuou ainda.
            </div>
        );
    }

    // Ensure rankings are sorted by value desc
    const sorted = [...rankings].sort((a, b) => b.value - a.value);

    return (
        <div className="rounded-lg border border-[#334155] overflow-hidden">
            <Table>
                <TableHeader className="bg-[#0F172A]">
                    <TableRow className="border-[#334155] hover:bg-[#0F172A]">
                        <TableHead className="w-[60px] text-center text-xs font-semibold text-[#94A3B8]">Pos.</TableHead>
                        <TableHead className="text-xs font-semibold text-[#94A3B8]">Participante</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-[#94A3B8]">Valor</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-[#94A3B8]">% Meta</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((rank, index) => {
                         const position = index + 1;
                         const percentage = goalTarget > 0 ? (rank.value / goalTarget) * 100 : 0;
                         
                         return (
                            <TableRow key={rank.user_id || index} className="border-[#334155] hover:bg-[#334155]/30 transition-colors">
                                <TableCell className="text-center font-medium text-[#E2E8F0]">
                                    {position <= 3 ? (
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[#E2E8F0] text-xs font-bold border border-[#334155] ${
                                            position === 1 ? 'bg-yellow-500 text-black border-yellow-400' :
                                            position === 2 ? 'bg-slate-400 text-black border-slate-300' :
                                            'bg-orange-500 text-black border-orange-400'
                                        }`}>
                                            {position}º
                                        </span>
                                    ) : (
                                        <span className="text-[#94A3B8] text-xs">{position}º</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-[#334155]">
                                            <AvatarImage src={rank.avatar_url} />
                                            <AvatarFallback className="bg-[#0F172A] text-[#94A3B8] text-xs">
                                                {rank.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-[#E2E8F0] truncate max-w-[150px]">
                                            {rank.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-sm text-[#E2E8F0] font-medium">
                                    {formatGoalValue(rank.value, rank.rankingType)}
                                </TableCell>
                                <TableCell className="text-right text-sm text-[#94A3B8]">
                                    {percentage.toFixed(1)}%
                                </TableCell>
                            </TableRow>
                         );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default RankingTable;