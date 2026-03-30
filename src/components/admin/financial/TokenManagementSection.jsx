import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, PlusCircle, MinusCircle, History, RefreshCw, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatNumberWithSuffix } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TokenManagementSection = ({ user }) => {
    const { toast } = useToast();
    const [distributors, setDistributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [actionType, setActionType] = useState(null); // 'add' or 'remove'
    const [tokenAmount, setTokenAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchDistributors();
    }, []);

    const fetchDistributors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, avatar_url, tokens, distributor_type')
                .in('role', ['distributor', 'sub-admin'])
                .order('name');
            
            if (error) throw error;
            setDistributors(data || []);
        } catch (error) {
            console.error("Error fetching distributors:", error);
            toast({ title: "Erro", description: "Falha ao carregar distribuidores.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (distributor, type) => {
        setSelectedDistributor(distributor);
        setActionType(type);
        setTokenAmount('');
        setReason('');
        setIsActionModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
            toast({ title: "Valor inválido", description: "Insira uma quantidade válida de tokens.", variant: "destructive" });
            return;
        }

        const amount = actionType === 'add' ? parseFloat(tokenAmount) : -parseFloat(tokenAmount);
        
        try {
            const { error } = await supabase.rpc('admin_adjust_token_balance', {
                p_admin_id: user.id,
                p_distributor_id: selectedDistributor.id,
                p_reason: reason || (actionType === 'add' ? 'Adição manual' : 'Remoção manual'),
                p_token_change: amount
            });

            if (error) throw error;

            toast({ title: "Sucesso", description: `Tokens ${actionType === 'add' ? 'adicionados' : 'removidos'} com sucesso.` });
            fetchDistributors(); // Refresh list
            setIsActionModalOpen(false);
        } catch (error) {
            console.error("Token adjustment error:", error);
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const handleHistoryClick = async (distributor) => {
        setSelectedDistributor(distributor);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('token_ledger')
                .select('*')
                .eq('distributor_id', distributor.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            setHistoryData(data || []);
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao carregar histórico.", variant: "destructive" });
        } finally {
            setHistoryLoading(false);
        }
    };

    const filteredDistributors = distributors.filter(d => 
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-white/10 bg-[#1e293b]/40 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" /> Gestão de Saldo de Tokens
                </CardTitle>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar distribuidor..."
                            className="pl-8 bg-slate-900 border-slate-700 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchDistributors} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-white/5 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-900/50">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-slate-400">Distribuidor</TableHead>
                                <TableHead className="text-right text-slate-400">Saldo Atual</TableHead>
                                <TableHead className="text-center text-slate-400">Tipo</TableHead>
                                <TableHead className="text-right text-slate-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell>
                                </TableRow>
                            ) : filteredDistributors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">Nenhum distribuidor encontrado.</TableCell>
                                </TableRow>
                            ) : (
                                filteredDistributors.map((dist) => (
                                    <TableRow key={dist.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={dist.avatar_url} />
                                                    <AvatarFallback>{dist.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-white">{dist.name}</p>
                                                    <p className="text-xs text-slate-400">{dist.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-yellow-400">
                                            {formatNumberWithSuffix(dist.tokens || 0)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                {dist.distributor_type === 'team' ? 'Equipe' : 'Externo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                                    onClick={() => handleActionClick(dist, 'add')}
                                                    title="Adicionar Tokens"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                    onClick={() => handleActionClick(dist, 'remove')}
                                                    title="Remover Tokens"
                                                >
                                                    <MinusCircle className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                                    onClick={() => handleHistoryClick(dist)}
                                                    title="Ver Histórico"
                                                >
                                                    <History className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Action Modal (Add/Remove) */}
            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>{actionType === 'add' ? 'Adicionar Tokens' : 'Remover Tokens'}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {actionType === 'add' ? 'Credite' : 'Debite'} tokens manualmente para {selectedDistributor?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input 
                                type="number" 
                                value={tokenAmount} 
                                onChange={(e) => setTokenAmount(e.target.value)}
                                className="bg-slate-800 border-slate-600"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo / Descrição</Label>
                            <Textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-slate-800 border-slate-600"
                                placeholder="Ex: Bônus de campanha..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsActionModalOpen(false)}>Cancelar</Button>
                        <Button 
                            className={actionType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleConfirmAction}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Modal */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Histórico de Tokens: {selectedDistributor?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto pr-2">
                        {historyLoading ? (
                            <div className="text-center py-8">Carregando...</div>
                        ) : historyData.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">Sem histórico recente.</div>
                        ) : (
                            <div className="space-y-4">
                                {historyData.map((entry) => (
                                    <div key={entry.id} className="flex justify-between items-start p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                        <div>
                                            <p className="font-medium text-sm">{entry.description}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(entry.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                                        </div>
                                        <div className={`font-bold ${entry.change_amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {entry.change_amount > 0 ? '+' : ''}{formatNumberWithSuffix(entry.change_amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default TokenManagementSection;