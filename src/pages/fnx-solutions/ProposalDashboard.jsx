import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { statusConfigs } from './statusConfigs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProposalDashboard = ({ proposals, loading, onEdit, onDelete, onViewTimeline, onNewProposal, isAdminOverride = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = 
            proposal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (proposal.distributor?.name && proposal.distributor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            proposal.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab = true;
        if (activeTab === 'active') {
             matchesTab = ['pending', 'awaiting_analysis', 'awaiting_adjustment', 'awaiting_signature'].includes(proposal.status);
        } else if (activeTab === 'completed') {
             matchesTab = ['approved', 'completed'].includes(proposal.status);
        } else if (activeTab === 'rejected') {
             matchesTab = ['rejected', 'cancelled'].includes(proposal.status);
        }
        
        return matchesSearch && matchesTab;
    });

    // Function to determine if a proposal is editable by the current user (or admin)
    const isEditable = (proposal) => {
        if (isAdminOverride) return true;
        return ['pending', 'awaiting_adjustment'].includes(proposal.status) || proposal.allow_distributor_edit;
    };

    return (
        <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border border-border/50 shadow-sm">
                <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="active">Ativas</TabsTrigger>
                        <TabsTrigger value="completed">Aprovadas</TabsTrigger>
                        <TabsTrigger value="rejected">Recusadas</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex w-full md:w-auto items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    {onNewProposal && (
                         <Button onClick={onNewProposal} className="hidden md:flex ml-2 whitespace-nowrap shiny-button">
                            <Plus className="h-4 w-4 mr-2" /> Nova Proposta
                        </Button>
                    )}
                </div>
                 {onNewProposal && (
                     <Button onClick={onNewProposal} className="flex md:hidden w-full shiny-button">
                        <Plus className="h-4 w-4 mr-2" /> Nova Proposta
                    </Button>
                )}
            </div>

            <div className="bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            {isAdminOverride && <TableHead>Distribuidor</TableHead>}
                            <TableHead>Valor Total</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={isAdminOverride ? 6 : 5} className="h-32 text-center">
                                    <div className="flex flex-col justify-center items-center gap-2 text-muted-foreground">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        <span className="text-sm">Carregando propostas...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProposals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdminOverride ? 6 : 5} className="h-32 text-center text-muted-foreground">
                                    <p>Nenhuma proposta encontrada.</p>
                                    {activeTab !== 'all' && <p className="text-xs">Tente mudar o filtro de status.</p>}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProposals.map((proposal) => {
                                const statusConfig = statusConfigs[proposal.status] || statusConfigs.default;
                                
                                return (
                                    <TableRow key={proposal.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">
                                            {formatDate(proposal.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{proposal.customer_name}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    #{proposal.id.slice(0, 8)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {isAdminOverride && (
                                            <TableCell>
                                                {proposal.distributor?.name || 'N/A'}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {formatCurrency(proposal.total_value)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                variant="outline" 
                                                className={cn("whitespace-nowrap", statusConfig.bgColor, statusConfig.borderColor, statusConfig.textColor)}
                                            >
                                                {statusConfig.title}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    title="Ver Timeline"
                                                    onClick={() => onViewTimeline(proposal)}
                                                >
                                                    <Eye className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                
                                                {isEditable(proposal) ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        title={isAdminOverride ? "Gerenciar" : "Editar"}
                                                        onClick={() => onEdit(proposal)}
                                                    >
                                                        {isAdminOverride ? <ShieldAlert className="h-4 w-4 text-orange-500" /> : <Edit className="h-4 w-4 text-primary" />}
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" disabled title="Edição bloqueada nesta fase">
                                                        <Edit className="h-4 w-4 opacity-30" />
                                                    </Button>
                                                )}

                                                {(isAdminOverride || ['pending', 'awaiting_adjustment'].includes(proposal.status)) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        title="Excluir"
                                                        onClick={() => onDelete(proposal.id)}
                                                        className="text-destructive hover:text-destructive/90"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ProposalDashboard;