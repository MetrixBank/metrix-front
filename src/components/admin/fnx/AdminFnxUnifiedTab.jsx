import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Percent, Loader2, AlertTriangle, Send, Wallet, TrendingUp } from 'lucide-react';
import { addDays } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import useFnxProposalsData from './hooks/useFnxProposalsData';

// Components
import FnxKpiCard from './FnxKpiCard';
import MonthlyCashflowChart from './MonthlyCashflowChart';
import ReceivablesPortfolioChart from './ReceivablesPortfolioChart';
import ProposalDashboard from '@/pages/fnx-solutions/ProposalDashboard';
import ProposalForm from '@/pages/fnx-solutions/ProposalForm';
import ProposalTimelineView from '@/pages/fnx-solutions/ProposalTimelineView';
import { ProposalDetailsModal } from '@/components/admin/proposals/ProposalDetailsModal';

const AdminFnxUnifiedTab = ({ user }) => {
    const { toast } = useToast();
    
    // --- Analytics State ---
    const [dateRange, setDateRange] = useState({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const { data: analyticsData, loading: analyticsLoading, refetch: refetchAnalytics } = useFnxProposalsData(dateRange.from, dateRange.to);

    // --- Proposals List State ---
    const [proposals, setProposals] = useState([]);
    const [proposalsLoading, setProposalsLoading] = useState(true);
    const [view, setView] = useState('dashboard'); // dashboard, form, timeline
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [proposalToDelete, setProposalToDelete] = useState(null);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

    // --- Fetch Proposals ---
    const fetchProposals = useCallback(async () => {
        setProposalsLoading(true);
        try {
            const { data, error } = await supabase
                .from('fnx_proposals')
                .select('*, distributor:profiles(id, name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProposals(data || []);
        } catch (error) {
            toast({ title: 'Erro ao buscar propostas', description: error.message, variant: 'destructive' });
        } finally {
            setProposalsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    // --- Handlers ---
    const handleDateChange = (newDate) => {
        if (newDate?.from && newDate?.to) {
            setDateRange(newDate);
            refetchAnalytics(newDate.from, newDate.to);
        }
    };

    const handleEdit = (proposal) => {
        // If admin wants to edit raw data via form
        setSelectedProposal(proposal);
        setView('form');
    };

    // Opens the Admin Management Modal (for approval, status change, etc.)
    const handleManage = (proposal) => {
        setSelectedProposal(proposal);
        // We keep view as 'dashboard' but open the modal overlay
    };

    const handleViewTimeline = (proposal) => {
        setSelectedProposal(proposal);
        setView('timeline');
    };

    const handleDelete = (proposalId) => {
        setProposalToDelete(proposalId);
        setIsDeleteConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        if (!proposalToDelete) return;
        try {
            const { error } = await supabase.rpc('delete_proposal', { p_proposal_id: proposalToDelete });
            if (error) throw error;
            toast({ title: 'Proposta excluída com sucesso!' });
            fetchProposals(); // Refresh list
            refetchAnalytics(dateRange.from, dateRange.to); // Refresh analytics
        } catch (error) {
            toast({ title: 'Erro ao excluir proposta', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleteConfirmationOpen(false);
            setProposalToDelete(null);
        }
    };

    const handleUpdate = (updatedProposal) => {
        setProposals(prev => prev.map(p => p.id === updatedProposal.id ? { ...p, ...updatedProposal } : p));
        refetchAnalytics(dateRange.from, dateRange.to); // Refresh analytics as status might have changed
        
        // If we were in modal context
        if (selectedProposal && selectedProposal.id === updatedProposal.id) {
            setSelectedProposal(prev => ({ ...prev, ...updatedProposal }));
        }
    };

    const handleBack = () => {
        setView('dashboard');
        setSelectedProposal(null);
    };

    // Determine if modal should be open (Management Mode)
    const isModalOpen = !!selectedProposal && view === 'dashboard';

    // --- Analytics Data Preparation ---
    const portfolioData = [
        { name: 'Pago', value: analyticsData?.portfolio_summary?.paid || 0, fill: 'hsl(var(--chart-1))' },
        { name: 'Pendente', value: analyticsData?.portfolio_summary?.pending || 0, fill: 'hsl(var(--chart-2))' },
        { name: 'Vencido', value: analyticsData?.portfolio_summary?.overdue || 0, fill: 'hsl(var(--chart-5))' },
    ];

    // --- Render ---
    if (view === 'form') {
        return <ProposalForm user={user} onBack={handleBack} existingProposal={selectedProposal} isViewMode={false} />;
    }

    if (view === 'timeline') {
        return <ProposalTimelineView proposal={selectedProposal} onBack={handleBack} onEdit={handleEdit} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Header Section with Analytics */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                         <h2 className="text-2xl font-bold text-gradient">MetriX Bank - Visão Geral</h2>
                         <p className="text-muted-foreground">Gerenciamento centralizado de crédito e propostas.</p>
                    </div>
                    <DatePickerWithRange date={dateRange} onDateChange={handleDateChange} />
                </div>

                {analyticsLoading ? (
                     <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <FnxKpiCard
                                title="Propostas Enviadas"
                                value={analyticsData.total_proposals_sent}
                                icon={Send}
                                format="integer"
                                description="Total no período"
                            />
                            <FnxKpiCard
                                title="Taxa de Aprovação"
                                value={analyticsData.approval_rate}
                                icon={Percent}
                                format="percentage"
                                description="Conversão em contratos"
                            />
                            <FnxKpiCard
                                title="Custo Liberado (Distribuidores)"
                                value={analyticsData.total_released_cost}
                                icon={Wallet}
                                format="currency"
                                description="Valor líquido (Principal)"
                            />
                            <FnxKpiCard
                                title="Recebível Total (FNX)"
                                value={analyticsData.total_fnx_value}
                                icon={TrendingUp}
                                format="currency"
                                description="Total c/ juros e taxas"
                            />
                             <FnxKpiCard
                                title="Taxa Padrão"
                                value={4.8} 
                                icon={Banknote}
                                format="percentage"
                                description="Juros mensal base"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-96">
                            <div className="lg:col-span-3 h-full">
                                <MonthlyCashflowChart data={analyticsData.monthly_cashflow} />
                            </div>
                            <div className="lg:col-span-2 h-full">
                                <ReceivablesPortfolioChart data={portfolioData} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Proposals List Section */}
            <div className="space-y-4 pt-6 border-t border-border/30">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-primary"/>
                    Gestão de Propostas
                </h3>
                <ProposalDashboard
                    proposals={proposals}
                    loading={proposalsLoading}
                    onEdit={handleManage} // Clicking edit in dashboard opens Management Modal
                    onDelete={handleDelete}
                    onViewTimeline={handleViewTimeline}
                    isAdminOverride={true} // Admins can edit anything
                />
            </div>

            {/* Management Modal */}
            {selectedProposal && (
                <ProposalDetailsModal
                    proposal={selectedProposal}
                    isOpen={isModalOpen}
                    onClose={() => setSelectedProposal(null)}
                    onUpdate={handleUpdate}
                    adminUser={user}
                />
            )}

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-destructive" />Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita e removerá todos os dados relacionados, incluindo recebíveis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir Definitivamente</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </motion.div>
    );
};

export default AdminFnxUnifiedTab;