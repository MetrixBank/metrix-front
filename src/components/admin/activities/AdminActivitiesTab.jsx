import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import OpportunityFilters from '@/components/admin/overview/OpportunityFilters';
import { Download, FileText, Loader2, Trello, Plus } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportUtils';
import KanbanBoard from './KanbanBoard';
import ActivityDetailsModal from './ActivityDetailsModal';
import { getStatusPortuguese, getActivityTypePortuguese, formatDate } from '@/lib/utils';
import { useDataSync } from '@/contexts/DataSyncContext';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';

const AdminActivitiesTab = () => {
  const [allActivities, setAllActivities] = useState([]);
  const [allDistributors, setAllDistributors] = useState([]);
  const [allConsultants, setAllConsultants] = useState([]);
  const [distributorHierarchy, setDistributorHierarchy] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    distributorId: 'all',
    customerSearch: '',
    activityStatus: 'all',
    consultantName: 'all',
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { syncKey, triggerSync } = useDataSync();

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchData = useCallback(async (isInitialLoad = true) => {
    if (isInitialLoad) setLoading(true);
    try {
      const { data: distributorsData, error: distributorsError } = await supabase
        .from('profiles')
        .select('id, name, email, distributor_type, parent_id')
        .in('role', ['distributor', 'sub-admin', 'master-admin']);

      if (distributorsError) throw distributorsError;
      setAllDistributors(distributorsData || []);
      
      const hierarchy = {};
      (distributorsData || []).forEach(d => {
          if (!hierarchy[d.id]) hierarchy[d.id] = [];
          let p = d.parent_id;
          while(p) {
              if(!hierarchy[p]) hierarchy[p] = [];
              hierarchy[p].push(d.id);
              const parentUser = distributorsData.find(u => u.id === p);
              p = parentUser ? parentUser.parent_id : null;
          }
      });
      setDistributorHierarchy(hierarchy);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('sales_opportunities')
        .select('*, distributor:profiles(*), opportunity_products:opportunity_products!left(*, product:products(id, name, sale_price, cost_price))')
        .order('visit_date', { ascending: false }); // Sorting newest to oldest

      if (activitiesError) throw activitiesError;
      setAllActivities(activitiesData || []);

      const uniqueConsultants = Array.from(new Set(
        (activitiesData || []).map(op => op.consultant_name).filter(Boolean)
      )).map(name => ({ name, id: name }));
      setAllConsultants(uniqueConsultants);

      if (isInitialLoad) toast({ title: 'Dados carregados!', description: 'Quadro de atividades e filtros atualizados.' });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, syncKey]);
  
  const filteredActivities = useMemo(() => {
    let activities = [...allActivities];
    
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        activities = activities.filter(op => op.visit_date && new Date(op.visit_date) >= startDate);
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        activities = activities.filter(op => op.visit_date && new Date(op.visit_date) <= endDate);
    }
    if (filters.distributorId && filters.distributorId !== 'all') {
      const descendantIds = new Set(distributorHierarchy[filters.distributorId] || []);
      descendantIds.add(filters.distributorId);
      activities = activities.filter(op => descendantIds.has(op.distributor_id));
    }
    if (filters.activityStatus && filters.activityStatus !== 'all') activities = activities.filter(op => op.status === filters.activityStatus);
    if (filters.customerSearch) activities = activities.filter(op => op.customer_name && op.customer_name.toLowerCase().includes(filters.customerSearch.toLowerCase()));
    if (filters.consultantName && filters.consultantName !== 'all') activities = activities.filter(op => op.consultant_name === filters.consultantName);
    
    // Sort logic within the component is usually handled by drag-and-drop or separate ranking logic,
    // but here we keep the date sort as a baseline before dragging
    return activities.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
  }, [allActivities, filters, distributorHierarchy]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId;
    const activityId = draggableId;

    const originalActivities = [...allActivities];
    const updatedActivities = allActivities.map(act =>
      act.id === activityId ? { ...act, status: newStatus } : act
    );
    setAllActivities(updatedActivities);

    const { error } = await supabase
      .from('sales_opportunities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activityId);

    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
      setAllActivities(originalActivities);
    } else {
      toast({ 
        title: 'Status atualizado', 
        description: `Movido para "${getStatusPortuguese(newStatus)}".`,
        variant: 'success'
      });
      triggerSync(); // Trigger context update for other components
    }
  };

  const handleExport = (format) => {
    if (!filteredActivities || filteredActivities.length === 0) {
        toast({ title: "Nenhum dado para exportar", description: "Por favor, ajuste seus filtros ou adicione atividades.", variant: "destructive"});
        return;
    }
    const dataToExport = filteredActivities.map(act => ({
      'Cliente': act.customer_name || 'N/A',
      'Data/Hora': formatDate(act.visit_date, act.visit_time),
      'Distribuidor': act.distributor?.name || 'N/A',
      'Tipo Distrib.': act.distributor?.distributor_type === 'team' ? 'Equipe' : 'Externo',
      'Consultor': act.consultant_name || 'N/A',
      'Status': getStatusPortuguese(act.status),
      'Tipo': getActivityTypePortuguese(act.activity_type),
      'Valor Venda': act.status === 'sale_made' && act.sale_value != null ? act.sale_value : 'N/A',
      'Produtos': (act.opportunity_products && act.opportunity_products.length > 0) ?
        act.opportunity_products.map(op => `${op.product?.name || 'Desconhecido'} (Qtd:${op.quantity_sold})`).join('; ') : 'Nenhum',
      'Notas': act.notes || ''
    }));

    const filename = "relatorio_atividades_crm";
    if (format === 'csv') exportToCSV(dataToExport, `${filename}.csv`);
    if (format === 'excel') exportToExcel(dataToExport, `${filename}.xlsx`, "Atividades");
    if (format === 'pdf') exportToPDF(dataToExport, `Relatório de Atividades CRM (${formatDate(new Date())})`, ['Cliente', 'Data/Hora', 'Distribuidor', 'Status', 'Valor Venda'], `${filename}.pdf`);

    toast({ title: "Exportação Iniciada", description: `O relatório será baixado em formato ${format.toUpperCase()}.` });
  };
  
  const openDetailsModal = (activity) => {
    setSelectedActivity(activity);
  };

  const handleAddSuccess = () => {
    fetchData(false);
    setIsAddModalOpen(false);
    triggerSync();
  };

  // Quick stats/insights for the header
  const overdueCount = filteredActivities.filter(a => {
      if (!a.visit_date) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      return new Date(a.visit_date) < today && (a.status === 'scheduled' || a.status === 'in_progress');
  }).length;

  const todayCount = filteredActivities.filter(a => {
    if (!a.visit_date) return false;
    const today = new Date();
    const visit = new Date(a.visit_date);
    return visit.getDate() === today.getDate() && 
           visit.getMonth() === today.getMonth() && 
           visit.getFullYear() === today.getFullYear() &&
           (a.status === 'scheduled' || a.status === 'in_progress');
  }).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
                 <Trello className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Pipeline de Vendas</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {overdueCount > 0 && (
                        <span className="text-red-400 flex items-center gap-1 font-medium bg-red-400/10 px-2 py-0.5 rounded text-xs">
                            {overdueCount} atrasadas
                        </span>
                    )}
                    {todayCount > 0 && (
                        <span className="text-amber-400 flex items-center gap-1 font-medium bg-amber-400/10 px-2 py-0.5 rounded text-xs">
                            {todayCount} para hoje
                        </span>
                    )}
                    <span>{filteredActivities.length} atividades totais</span>
                </div>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Nova Atividade
          </Button>
          <div className="h-9 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm" className="bg-[#161922] border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex-1 sm:flex-none">
            CSV
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="bg-[#161922] border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex-1 sm:flex-none">
            XLS
          </Button>
        </div>
      </div>

      {/* Filters - Collapsible or Compact */}
      <div className="flex-shrink-0">
          <OpportunityFilters
            filters={filters}
            handleFilterChange={handleFilterChange}
            distributors={allDistributors}
            consultants={allConsultants}
            fetchData={() => fetchData(true)}
            loading={loading}
            showCustomerSearch={true}
            showActivityStatus={false} // Hidden as we use columns
            showConsultantFilter={true}
            showDistributorTypeFilter={false}
          />
      </div>

      {/* Kanban Board Area */}
      {loading ? (
        <div className="flex-grow flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-grow overflow-hidden relative min-h-[600px] border border-white/5 rounded-xl bg-[#0f1115]">
             <KanbanBoard
              activities={filteredActivities}
              onDragEnd={handleDragEnd}
              onCardClick={openDetailsModal}
              enableDragAndDrop={true}
            />
        </div>
      )}

      {/* Details Modal */}
      <ActivityDetailsModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

      {/* Add Modal */}
      <AddSalesActivityModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onActivityAdded={handleAddSuccess}
      />
      
      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-20 right-4 md:hidden z-50">
        <Button 
            onClick={() => setIsAddModalOpen(true)} 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-white"
        >
            <Plus className="w-6 h-6" />
        </Button>
      </div>

    </motion.div>
  );
};

export default AdminActivitiesTab;