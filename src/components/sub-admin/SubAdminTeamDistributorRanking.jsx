import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const SubAdminTeamDistributorRanking = ({ data, loading }) => {
    if (loading) return <Skeleton className="h-[500px] w-full rounded-xl bg-slate-800/50" />;

    return (
        <Card className="bg-[#1e293b]/40 border-white/10 shadow-lg col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg text-white font-semibold">Ranking da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-white/5 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[80px] text-slate-400">Posição</TableHead>
                                <TableHead className="text-slate-400">Membro da Equipe</TableHead>
                                <TableHead className="text-right text-slate-400">Receita Total</TableHead>
                                <TableHead className="text-center text-slate-400">Atividades</TableHead>
                                <TableHead className="text-center text-slate-400">Conversão</TableHead>
                                <TableHead className="text-right text-slate-400">Pontos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.slice(0, 10).map((dist, idx) => (
                                    <TableRow key={dist.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell>
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                                                idx === 0 ? 'bg-yellow-500 text-black' : 
                                                idx === 1 ? 'bg-slate-400 text-black' : 
                                                idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-white/10">
                                                    <AvatarImage src={dist.avatar} />
                                                    <AvatarFallback>{dist.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-200 font-medium">{dist.name}</span>
                                                    <span className="text-xs text-slate-500">ID: {dist.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-emerald-400 font-medium">
                                            {formatCurrency(dist.revenue)}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-300">
                                            {dist.activities}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={`${
                                                dist.conversionRate >= 20 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                                dist.conversionRate >= 10 ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                'border-slate-500/30 text-slate-400'
                                            }`}>
                                                {dist.conversionRate.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-300">
                                            {formatNumberWithSuffix(dist.points)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        Nenhum dado encontrado para o período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default SubAdminTeamDistributorRanking;