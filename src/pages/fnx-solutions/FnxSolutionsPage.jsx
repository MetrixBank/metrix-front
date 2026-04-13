import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/components/ui/alert-dialog';
import { Helmet } from 'react-helmet-async';
import DashboardHeader from '@/components/DashboardHeader';

const ProposalForm = lazy(() => import('./ProposalForm'));
const ProposalTimelineView = lazy(() => import('./ProposalTimelineView'));
const FinancialDashboard = lazy(() => import('./FinancialDashboard'));
const CreditLoanSimulatorView = lazy(() => import('./CreditLoanSimulatorView'));

const FnxSolutionsPage = ({ logoUrl: _logoUrl }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [bankView, setBankView] = useState('finance');
  const [currentProposal, setCurrentProposal] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState(null);

  const handleBackToDashboard = () => {
    setView('dashboard');
    setCurrentProposal(null);
    setIsViewMode(false);
    fetchData();
  };

  const handleNewProposal = () => {
    setCurrentProposal(null);
    setIsViewMode(false);
    setView('form');
  };

  const handleViewTimeline = (proposal) => {
    setCurrentProposal(proposal);
    setView('timeline');
  };

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
      toast({ title: 'Sucesso!', description: 'A proposta foi excluída.' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (loading && proposals.length === 0 && view === 'dashboard') {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (view === 'form') {
      return (
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          }
        >
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
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          }
        >
          <ProposalTimelineView
            proposal={currentProposal}
            onBack={handleBackToDashboard}
            onEdit={handleEditProposal}
          />
        </Suspense>
      );
    }

    if (bankView === 'loan') {
      return (
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          }
        >
          <CreditLoanSimulatorView
            proposals={proposals}
            loading={loading}
            onBack={() => setBankView('finance')}
            onCreateProposal={handleNewProposal}
            onEdit={handleEditProposal}
            onDelete={confirmDeleteProposal}
            onViewTimeline={handleViewTimeline}
          />
        </Suspense>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        }
      >
        <FinancialDashboard
          user={user}
          proposalsMadeCount={proposals.length}
          onOpenLoanSimulator={() => setBankView('loan')}
          pageTitle="MetriX Bank"
          pageSubtitle="Central de crédito, fluxo de caixa e cobranças — tudo integrado."
        />
      </Suspense>
    );
  };

  return (
    <div className="fnx-theme flex flex-col min-h-screen bg-background text-foreground">
      <Helmet>
        <title>MetriX Bank</title>
        <meta
          name="description"
          content="Central MetriX Bank: fluxo de caixa, cobranças e simulador de crédito."
        />
      </Helmet>
      <DashboardHeader />
      <main className="flex-grow pt-20 p-4 md:p-6 overflow-y-auto custom-scrollbar">{renderContent()}</main>
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
