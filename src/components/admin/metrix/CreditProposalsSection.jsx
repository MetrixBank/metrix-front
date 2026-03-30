import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const CreditProposalsSection = ({ user }) => {
    const { toast } = useToast();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);
    
    // Action Modals
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            // Fetch fnx_proposals with distributor details
            const { data, error } = await supabase
                .from('fnx_proposals')
                .select(`
                    *,
                    distributor:profiles (id, name, email, phone, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProposals(data || []);
        } catch (error) {
            console.error("Error fetching credit proposals:", error);
            toast({ title: "Erro", description: "Falha ao carregar propostas de crédito.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (proposal) => {
        setSelectedProposal(proposal);
        setAdminNotes(proposal.admin_notes || '');
        setIsApproveModalOpen(true);
    };

    const handleRejectClick = (proposal) => {
        setSelectedProposal(proposal);
        setAdminNotes(proposal.admin_notes || '');
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const processStatusChange = async (newStatus, notes, rejectionReason = null) => {
        if (!selectedProposal) return;
        
        try {
            const updates = {
                status: newStatus,
                admin_notes: notes,
                updated_at: new Date().toISOString()
            };
            
            // Append rejection reason to edit_history or notes if needed
            let historyLog = selectedProposal.edit_history || [];
            historyLog.push({
                timestamp: new Date().toISOString(),
                admin_id: user.id,
                action: `Status changed to ${newStatus}`,
                reason: rejectionReason
            });

            // Use the admin update RPC ideally, but direct update for now if RLS permits
            const { error } = await supabase
                .from('fnx_proposals')
                .update({ ...updates, edit_history: historyLog })
                .eq('id', selectedProposal.id);

            if (error) throw error;

            toast({ title: "Sucesso", description: `Proposta ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.` });
            fetchProposals();
            setIsApproveModalOpen(false);
            setIsRejectModalOpen(false);
        } catch (error) {
            console.error("Error updating proposal:", error);
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const filteredProposals = proposals.filter(p => {
        const matchesSearch = p.distributor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalRequested: proposals.reduce((acc, p) => acc + (Number(p.total_value) || 0), 0),
        totalApproved: proposals.filter(p => p.status === 'approved').reduce((acc, p) => acc + (Number(p.total_value) || 0), 0),
        pendingCount: proposals.filter(p => p.status === 'pending').length
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Aprovado</Badge>;
            case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rejeitado</Badge>;
            case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pendente</Badge>;
            case 'under_review': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Em Análise</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-800/50 border-white/5">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-400">Total Solicitado</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRequested)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-white/5">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-400">Crédito Aprovado</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalApproved)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-white/5">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-400">Pendentes de Análise</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-white/10 bg-[#1e293b]/40 backdrop-blur">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" /> Propostas de Crédito
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar distribuidor ou ID..."
                                className="pl-8 bg-slate-900 border-slate-700 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-700 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                                <SelectItem value="under_review">Em Análise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="text-slate-400">Distribuidor</TableHead>
                                    <TableHead className="text-slate-400">Data</TableHead>
                                    <TableHead className="text-right text-slate-400">Valor Solicitado</TableHead>
                                    <TableHead className="text-center text-slate-400">Status</TableHead>
                                    <TableHead className="text-right text-slate-400">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell>
                                    </TableRow>
                                ) : filteredProposals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">Nenhuma proposta encontrada.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProposals.map((proposal) => (
                                        <React.Fragment key={proposal.id}>
                                            <TableRow className={`border-white/5 hover:bg-white/5 ${expandedRow === proposal.id ? 'bg-white/5' : ''}`}>
                                                <TableCell>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => setExpandedRow(expandedRow === proposal.id ? null : proposal.id)}
                                                    >
                                                        {expandedRow === proposal.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={proposal.distributor?.avatar_url} />
                                                            <AvatarFallback>{proposal.distributor?.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-white">{proposal.distributor?.name}</p>
                                                            <p className="text-xs text-slate-400">ID: {proposal.id.slice(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-300">
                                                    {formatDate(proposal.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-white">
                                                    {formatCurrency(proposal.total_value)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getStatusBadge(proposal.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                                            onClick={(e) => { e.stopPropagation(); handleApproveClick(proposal); }}
                                                            disabled={proposal.status === 'approved'}
                                                            title="Aprovar"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                            onClick={(e) => { e.stopPropagation(); handleRejectClick(proposal); }}
                                                            disabled={proposal.status === 'rejected'}
                                                            title="Rejeitar"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Expanded Detail Row */}
                                            <AnimatePresence>
                                                {expandedRow === proposal.id && (
                                                    <TableRow className="border-white/5 bg-slate-900/30">
                                                        <TableCell colSpan={6} className="p-0">
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }} 
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                            <User className="w-4 h-4" /> Detalhes do Distribuidor
                                                                        </h4>
                                                                        <div className="space-y-2 text-sm text-slate-300">
                                                                            <p><span className="text-slate-500">Email:</span> {proposal.distributor?.email}</p>
                                                                            <p><span className="text-slate-500">Telefone:</span> {proposal.distributor?.phone || 'N/A'}</p>
                                                                        </div>
                                                                        
                                                                        <div className="pt-4">
                                                                             <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                                                <FileText className="w-4 h-4" /> Descrição / Notas
                                                                            </h4>
                                                                            <p className="text-sm text-slate-300 bg-white/5 p-3 rounded border border-white/5">
                                                                                {proposal.notes || proposal.description || 'Sem descrição fornecida.'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                            <DollarSign className="w-4 h-4" /> Detalhes Financeiros
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="bg-slate-800 p-3 rounded">
                                                                                <p className="text-xs text-slate-500">Valor Total</p>
                                                                                <p className="font-bold text-white">{formatCurrency(proposal.total_value)}</p>
                                                                            </div>
                                                                            <div className="bg-slate-800 p-3 rounded">
                                                                                <p className="text-xs text-slate-500">Entrada</p>
                                                                                <p className="font-bold text-white">{formatCurrency(proposal.upfront_payment || 0)}</p>
                                                                            </div>
                                                                            <div className="bg-slate-800 p-3 rounded">
                                                                                <p className="text-xs text-slate-500">Parcelas</p>
                                                                                <p className="font-bold text-white">{proposal.installments}x</p>
                                                                            </div>
                                                                            <div className="bg-slate-800 p-3 rounded">
                                                                                 <p className="text-xs text-slate-500">1º Vencimento</p>
                                                                                 <p className="font-bold text-white">{proposal.first_payment_due_date ? formatDate(proposal.first_payment_due_date) : 'N/A'}</p>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="pt-4">
                                                                             <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                                                Notas do Administrador
                                                                            </h4>
                                                                            <Textarea 
                                                                                className="bg-slate-800 border-slate-700 text-sm"
                                                                                placeholder="Adicione notas internas..."
                                                                                defaultValue={proposal.admin_notes}
                                                                                onBlur={(e) => {
                                                                                    // Simple autosave or manual save button could be added here
                                                                                    if (e.target.value !== proposal.admin_notes) {
                                                                                        // Call separate update function if needed, or rely on modal actions
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Approve Modal */}
            <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Aprovar Proposta</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Você está prestes a aprovar o crédito de {selectedProposal && formatCurrency(selectedProposal.total_value)} para {selectedProposal?.distributor?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Notas do Administrador (Opcional)</Label>
                            <Textarea 
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="bg-slate-800 border-slate-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsApproveModalOpen(false)}>Cancelar</Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => processStatusChange('approved', adminNotes)}
                        >
                            Confirmar Aprovação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Rejeitar Proposta</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Esta ação rejeitará a solicitação de crédito. Por favor, forneça um motivo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-red-400">Motivo da Rejeição (Obrigatório)</Label>
                            <Textarea 
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="bg-slate-800 border-slate-600"
                                placeholder="Explique o motivo..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notas Internas (Opcional)</Label>
                            <Textarea 
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="bg-slate-800 border-slate-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Cancelar</Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700"
                            disabled={!rejectReason}
                            onClick={() => processStatusChange('rejected', adminNotes, rejectReason)}
                        >
                            Confirmar Rejeição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreditProposalsSection;