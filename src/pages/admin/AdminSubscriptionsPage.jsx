import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Search, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select(`
                *,
                user:profiles!user_subscriptions_user_id_fkey(name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscriptions(data || []);
    } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Falha ao carregar assinaturas.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleManualAction = async (subId, action) => {
      // In a real scenario, this would call an Edge Function to manually adjust Stripe or DB
      // For this demo, we'll simulate a DB update for "Grant/Revoke" if Stripe isn't involved strictly
      toast({ title: "Ação Admin", description: `${action} solicitada. Implementação pendente na API.` });
  };

  const filteredSubs = subscriptions.filter(sub => 
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 bg-[#0B0E14] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Assinaturas</h1>
        <Button onClick={fetchSubscriptions} variant="outline" className="border-white/10 text-white hover:bg-white/5">
            Atualizar
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-[#161922] p-4 rounded-xl border border-white/5">
        <Search className="text-slate-400 w-5 h-5" />
        <Input 
            placeholder="Buscar por email ou nome..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 text-white focus-visible:ring-0 max-w-md"
        />
      </div>

      <Card className="bg-[#161922] border-white/10">
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">Usuário</TableHead>
                        <TableHead className="text-slate-400">Plano</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Período Atual</TableHead>
                        <TableHead className="text-slate-400">Criado em</TableHead>
                        <TableHead className="text-right text-slate-400">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                Carregando dados...
                            </TableCell>
                        </TableRow>
                    ) : filteredSubs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                Nenhuma assinatura encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredSubs.map(sub => (
                            <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                    <div className="font-medium text-white">{sub.user?.name || 'Sem nome'}</div>
                                    <div className="text-xs text-slate-500">{sub.user?.email}</div>
                                </TableCell>
                                <TableCell className="text-white capitalize">{sub.plan_type}</TableCell>
                                <TableCell>
                                    <Badge className={`${sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                                        {sub.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-400 text-sm">
                                    {sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy") : '-'}
                                </TableCell>
                                <TableCell className="text-slate-400 text-sm">
                                    {format(new Date(sub.created_at), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#1e2330] border-white/10 text-white">
                                            <DropdownMenuItem onClick={() => handleManualAction(sub.id, 'grant')}>
                                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" /> Ativar Premium
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleManualAction(sub.id, 'revoke')}>
                                                <XCircle className="w-4 h-4 mr-2 text-rose-400" /> Revogar Acesso
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionsPage;