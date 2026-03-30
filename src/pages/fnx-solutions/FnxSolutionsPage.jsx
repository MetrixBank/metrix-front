import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/contexts/DataSyncContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Helmet } from 'react-helmet-async';
import DashboardHeader from '@/components/DashboardHeader';

const ProposalDashboard = lazy(() => import('./ProposalDashboard'));
const ProposalForm = lazy(() => import('./ProposalForm'));
const ProposalTimelineView = lazy(() => import('./ProposalTimelineView'));
const FnxBankDashboard = lazy(() => import('./FnxBankDashboard'));
const ProposalSimulator = lazy(() => import('./ProposalSimulator'));

const FnxSolutionsPage = ({ logoUrl }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { syncKey, triggerSync } = useDataSync();
    const { toast } = useToast();
    
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'timeline'
    const [currentProposal, setCurrentProposal] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [proposalToDelete, setProposalToDelete] = useState(null);

    const handleBackToDashboard = () => {
        setView('dashboard');
        setCurrentProposal(null);
        setIsViewMode(false);
        triggerSync(); // Ensure data is fresh when returning
    };

    const handleNewProposal = () => {
        setCurrentProposal(null);
        setIsViewMode(false);
        setView('form');
    };
    
    const handleViewTimeline = (proposal) => {
        setCurrentProposal(proposal);
        setView('timeline');
    }

    const handleEditProposal = (proposal) => {
        setCurrentProposal(proposal);
        setIsViewMode(false);
        setView('form');
    };

    const confirmDeleteProposal = (proposalId) => {
        setProposalToDelete(proposalId);
    };

    const handleDeleteProposal = async () => {
        if (!proposalToDelete) return;
        try {
            const { error } = await supabase.rpc('delete_proposal', { p_proposal_id: proposalToDelete });
            if (error) throw error;
            toast({ title: "Sucesso!", description: "A proposta foi excluída." });
            fetchData(); // Reload data immediately
            triggerSync();
        } catch (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        } finally {
            setProposalToDelete(null);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fnx_proposals')
                .select('*, distributor:distributor_id (name)')
                .eq('distributor_id', user.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setProposals(data || []);
        } catch (error) {
            console.error('Error fetching MetriX Bank data:', error);
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);

    const renderContent = () => {
        if (loading && proposals.length === 0) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            );
        }

        if (view === 'form') {
            return (
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
                    <ProposalForm 
                        user={user}
                        onBack={handleBackToDashboard}
                        existingProposal={currentProposal}
                        isViewMode={isViewMode}
                    />
                </Suspense>
            );
        }

        if (view === 'timeline') {
            return (
                 <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
                    <ProposalTimelineView proposal={currentProposal} onBack={handleBackToDashboard} onEdit={handleEditProposal} />
                </Suspense>
            )
        }

        return (
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h1 className="text-3xl font-bold text-gradient">MetriX Bank</h1>
                    <p className="text-muted-foreground">Central de crédito e soluções financeiras.</p>
                </div>
                
                <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
                    <FnxBankDashboard 
                        proposals={proposals}
                        onNewProposalClick={handleNewProposal} 
                    />
                    <ProposalSimulator />
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Suas Propostas</h2>
                        <ProposalDashboard 
                            proposals={proposals}
                            loading={loading}
                            onNew={handleNewProposal}
                            onEdit={handleEditProposal}
                            onDelete={confirmDeleteProposal}
                            onViewTimeline={handleViewTimeline}
                        />
                    </div>
                </Suspense>
            </div>
        );
    };

    return (
        <div className="fnx-theme flex flex-col min-h-screen bg-background text-foreground">
            <Helmet>
                <title>MetriX Bank - Propostas</title>
                <meta name="description" content="Sua central de soluções financeiras, propostas e simulador de crédito." />
            </Helmet>
            <DashboardHeader />
            <main className="flex-grow pt-20 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                 {renderContent()}
            </main>
             <AlertDialog open={!!proposalToDelete} onOpenChange={() => setProposalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a proposta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteProposal}
                        >
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default FnxSolutionsPage;