import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Coins, PlusCircle, Filter, RefreshCw, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import AddTokensModal from '@/components/admin/AddTokensModal';
import ManualTokenHistoryModal from './ManualTokenHistoryModal';
import DistributorsList from '@/components/admin/DistributorsList';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import OpportunityFilters from '@/components/admin/overview/OpportunityFilters';

const AdminFinancialTab = () => {
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
                .select('id, name, email, tokens, distributor_type')
                .in('role', ['distributor', 'sub-admin']);

            if (profilesError) throw profilesError;
            setAllDistributors(profilesData || []);

        } catch (err) {
            console.error(err);
            setError(err.message);
            toast({ title: "Erro ao buscar dados financeiros", description: err.message, variant: "destructive" });
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
            
            toast({
                title: "Classificação atualizada!",
                description: `O distribuidor foi classificado como ${newType === 'team' ? 'Equipe' : 'Externo'}.`,
            });
            
            triggerSync();
        } catch (error) {
            toast({
                title: "Erro ao atualizar",
                description: `Não foi possível alterar a classification: ${error.message}`,
                variant: "destructive"
            });
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
      
      // Since this tab doesn't have a hierarchy filter, we don't filter by distributorId here
      // It's just for consistency with other tabs' filter components.
      
      return filtered;
    }, [allDistributors, filters]);

    const totalTokensInCirculation = useMemo(() => {
        return filteredDistributors.reduce((acc, dist) => acc + (dist.tokens || 0), 0);
    }, [filteredDistributors]);
    
    const handleFilterChange = (name, value) => {
        if (name === "customerSearch") {
             setFilters(prev => ({ ...prev, searchQuery: value }));
        } else {
             setFilters(prev => ({ ...prev, [name]: value }));
        }
    };

    if (error) {
        return (
            <div className="text-center text-red-500">
                <p>Ocorreu um erro ao carregar os dados.</p>
                <Button onClick={fetchData} className="mt-4">Tentar Novamente</Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gradient">
                        Gestão Financeira e de Tokens
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setHistoryModalOpen(true)} variant="outline">
                            <History className="w-4 h-4 mr-2" /> Histórico
                        </Button>
                        <Button onClick={fetchData} disabled={loading} size="icon" variant="ghost">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </motion.div>

             <OpportunityFilters
                filters={{...filters, customerSearch: filters.searchQuery}}
                handleFilterChange={handleFilterChange}
                distributors={[]} // This tab does not filter by distributor, but needs the prop
                consultants={[]} // not needed
                fetchData={fetchData}
                loading={loading}
                showCustomerSearch={true}
                showActivityStatus={false}
                showConsultantFilter={false}
                showDistributorTypeFilter={false}
            />

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="card-gradient">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-md text-gradient flex items-center">
                            <Coins className="w-5 h-5 mr-2" /> Tokens em Circulação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-primary">{formatNumberWithSuffix(totalTokensInCirculation, 4)}</p>
                         <p className="text-lg font-semibold text-muted-foreground">
                            ({formatCurrency(totalTokensInCirculation * TOKEN_TO_BRL_RATE)})
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Soma dos tokens dos distribuidores filtrados.
                      </p>
                    </CardContent>
                </Card>
            </motion.div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : (
                <DistributorsList
                    distributors={filteredDistributors}
                    onAddTokens={handleAddTokens}
                    onDistributorTypeChange={handleDistributorTypeChange}
                />
            )}

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

export default AdminFinancialTab;