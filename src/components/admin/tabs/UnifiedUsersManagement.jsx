import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumberWithSuffix } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const UnifiedUsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Fetch profiles with a mock performance metric approach
                // Ideally, we would join with aggregated sales_opportunities here
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('points', { ascending: false });
                
                if (error) throw error;
                setUsers(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" /></div>;

    return (
         <Card className="bg-[#161922] border-white/5">
            <CardHeader>
                <CardTitle className="text-white">Gestão Unificada de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader className="bg-[#0B0E14]">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-slate-400">Usuário</TableHead>
                            <TableHead className="text-slate-400">Função</TableHead>
                            <TableHead className="text-slate-400 text-right">Pontos</TableHead>
                            <TableHead className="text-slate-400 text-right">Tokens</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                                <TableCell className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-white/10">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-violet-900 text-white text-xs">{user.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium text-sm">{user.name}</span>
                                        <span className="text-slate-500 text-xs">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize bg-white/5 border-white/10 text-slate-300">
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-violet-300 font-mono">
                                    {formatNumberWithSuffix(user.points)}
                                </TableCell>
                                <TableCell className="text-right text-amber-300 font-mono">
                                    {formatNumberWithSuffix(user.tokens)}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-0">Ativo</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Gerenciar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default UnifiedUsersManagement;