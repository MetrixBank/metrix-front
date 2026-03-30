import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Coins, History, RefreshCw, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import AddTokensModal from '@/components/admin/AddTokensModal';
import ManualTokenHistoryModal from '@/components/admin/financial/ManualTokenHistoryModal';
import DistributorsList from '@/components/admin/DistributorsList';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import OpportunityFilters from '@/components/admin/overview/OpportunityFilters';
import CreditProposalsSection from '@/components/admin/metrix/CreditProposalsSection';

const MetrixBankTab = () => {
    const { user } = useAuth();
    const [allDistributors, setAllDistributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [isAddTokensModalOpen, setAddTokensModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        distributorId: 'all',
        searchQuery: '',
    });
    const { syncKey, triggerSync } = useDataSync();

    const TOKEN_TO_BRL_RATE = 5000;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email, tokens, points, distributor_type')
                .in('role', ['distributor', 'sub-admin']);

            if (profilesError) throw profilesError;
            setAllDistributors(profilesData || []);

        } catch (err) {
            console.error(err);
            setError(err.message);
            toast({ title: "Erro ao buscar dados do Metrix Bank", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);

    const handleAddTokens = useCallback((distributor) => {
        setSelectedDistributor(distributor);
        setAddTokensModalOpen(true);
    }, []);
    
    const handleDistributorTypeChange = async (distributorId, newType) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ distributor_type: newType, updated_at: new Date().toISOString() })
                .eq('id', distributorId);

            if (error) throw error;
            toast({ title: "Classificação atualizada!", description: `O distribuidor foi classificado como ${newType === 'team' ? 'Equipe' : 'Externo'}.` });
            triggerSync();
        } catch (error) {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        }
    };
    
    const filteredDistributors = useMemo(() => {
      let filtered = [...allDistributors];
      if (filters.searchQuery) {
          filtered = filtered.filter(d =>
              d.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
              d.email.toLowerCase().includes(filters.searchQuery.toLowerCase())
          );
      }
      return filtered;
    }, [allDistributors, filters]);

    const totalTokensInCirculation = useMemo(() => filteredDistributors.reduce((acc, dist) => acc + (dist.tokens || 0), 0), [filteredDistributors]);
    const totalPointsInCirculation = useMemo(() => filteredDistributors.reduce((acc, dist) => acc + (dist.points || 0), 0), [filteredDistributors]);

    const handleFilterChange = (name, value) => {
        if (name === "customerSearch") setFilters(prev => ({ ...prev, searchQuery: value }));
        else setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (error) return <div className="text-center text-red-500"><p>Ocorreu um erro.</p><Button onClick={fetchData} className="mt-4">Tentar Novamente</Button></div>;

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-emerald-400" /> MétriX Bank
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setHistoryModalOpen(true)} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            <History className="w-4 h-4 mr-2" /> Histórico de Transações
                        </Button>
                        <Button onClick={fetchData} disabled={loading} size="icon" variant="ghost">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="card-gradient border-emerald-500/20">
                    <CardHeader><CardTitle className="flex items-center text-emerald-400"><Coins className="mr-2"/> Tokens (Moeda)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-white">{formatNumberWithSuffix(totalTokensInCirculation, 4)}</p>
                            <p className="text-sm font-mono text-emerald-500/80">
                                ≈ {formatCurrency(totalTokensInCirculation * TOKEN_TO_BRL_RATE)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-gradient border-amber-500/20">
                    <CardHeader><CardTitle className="flex items-center text-amber-400"><Landmark className="mr-2"/> Pontos (Fidelidade)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-white">{formatNumberWithSuffix(totalPointsInCirculation)} pts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Credit Proposals Section */}
            <CreditProposalsSection user={user} />

            {/* Distributors List for Token/Point Overview */}
            <div className="pt-6 border-t border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Visão Geral de Contas</h3>
                
                <OpportunityFilters
                    filters={{...filters, customerSearch: filters.searchQuery}}
                    handleFilterChange={handleFilterChange}
                    distributors={[]}
                    consultants={[]}
                    fetchData={fetchData}
                    loading={loading}
                    showCustomerSearch={true}
                    customerSearchLabel="Buscar Distribuidor"
                    showActivityStatus={false}
                    showConsultantFilter={false}
                    showDistributorTypeFilter={false}
                />

                {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
                ) : (
                    <DistributorsList
                        distributors={filteredDistributors}
                        onAddTokens={handleAddTokens}
                        onDistributorTypeChange={handleDistributorTypeChange}
                    />
                )}
            </div>

            {isAddTokensModalOpen && selectedDistributor && (
                <AddTokensModal
                    isOpen={isAddTokensModalOpen}
                    onClose={() => setAddTokensModalOpen(false)}
                    distributor={selectedDistributor}
                    adminUserId={user.id}
                    onSuccess={triggerSync}
                />
            )}
            
            {isHistoryModalOpen && (
                <ManualTokenHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MetrixBankTab;