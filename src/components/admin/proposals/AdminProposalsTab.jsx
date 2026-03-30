import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, BarChart2, List } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/hooks/useAuth';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import ProposalDashboard from '@/pages/fnx-solutions/ProposalDashboard';
import ProposalForm from '@/pages/fnx-solutions/ProposalForm';
import ProposalTimelineView from '@/pages/fnx-solutions/ProposalTimelineView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProposalsAnalyticsDashboard from './ProposalsAnalyticsDashboard';

const AdminProposalsTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { syncKey, triggerSync } = useDataSync();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard'); // dashboard, form, timeline
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [proposalToDelete, setProposalToDelete] = useState(null);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

    const fetchProposals = useCallback(async () => {
        setLoading(true);
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
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals, syncKey]);

    const handleEdit = (proposal) => {
        setSelectedProposal(proposal);
        setView('form');
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
            triggerSync();
        } catch (error) {
            toast({ title: 'Erro ao excluir proposta', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleteConfirmationOpen(false);
            setProposalToDelete(null);
        }
    };

    const handleViewTimeline = (proposal) => {
        setSelectedProposal(proposal);
        setView('timeline');
    };

    const handleBack = () => {
        setView('dashboard');
        setSelectedProposal(null);
    };

    const handleUpdate = (updatedProposal) => {
        setProposals(prev => prev.map(p => p.id === updatedProposal.id ? { ...p, ...updatedProposal } : p));
        if (selectedProposal && selectedProposal.id === updatedProposal.id) {
            setSelectedProposal(prev => ({ ...prev, ...updatedProposal }));
        }
    };
    
    // Override isDeletable logic for Admins - they can delete anything
    const isAdmin = user.role === 'master-admin' || user.role === 'admin';

    const renderContent = () => {
        switch (view) {
            case 'form':
                return <ProposalForm user={user} onBack={handleBack} existingProposal={selectedProposal} isViewMode={false} />; // View mode false because admins can edit
            case 'timeline':
                return <ProposalTimelineView proposal={selectedProposal} onBack={handleBack} onEdit={handleEdit} />;
            default:
                return (
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list"><List className="w-4 h-4 mr-2" />Lista de Propostas</TabsTrigger>
                            <TabsTrigger value="analytics"><BarChart2 className="w-4 h-4 mr-2" />Análise de Dados</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list">
                            <ProposalDashboard
                                proposals={proposals}
                                loading={loading}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewTimeline={handleViewTimeline}
                                isAdminOverride={isAdmin} // Pass admin override to enable all buttons
                            />
                        </TabsContent>
                        <TabsContent value="analytics">
                            <ProposalsAnalyticsDashboard proposals={proposals} loading={loading} />
                        </TabsContent>
                    </Tabs>
                );
        }
    };

    return (
        <div>
            {renderContent()}
            {selectedProposal && view === 'dashboard' && (
                <ProposalDetailsModal
                    proposal={selectedProposal}
                    isOpen={!!selectedProposal}
                    onClose={() => setSelectedProposal(null)}
                    onUpdate={handleUpdate}
                    adminUser={user}
                />
            )}
            <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-destructive" />Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir Definitivamente</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminProposalsTab;