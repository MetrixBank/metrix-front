import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, Trello, PlusCircle, Filter, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { getStatusPortuguese, getActivityTypePortuguese, formatDate } from '@/lib/utils';
import TutorialStep from '@/components/tutorial/TutorialStep';
import { useTutorial } from '@/contexts/TutorialContext';
import useMediaQuery from '@/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const KanbanBoard = lazy(() => import('@/components/admin/activities/KanbanBoard'));
const ActivityDetailsModal = lazy(() => import('@/components/admin/activities/ActivityDetailsModal'));
const AddSalesActivityModal = lazy(() => import('@/components/AddSalesActivityModal'));
const OpportunityFilters = lazy(() => import('@/components/admin/overview/OpportunityFilters'));

const ActivitiesTab = () => {
  const { user, profile } = useAuth();
  const [allActivities, setAllActivities] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerSearch: '',
    activityStatus: 'all',
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const { isTutorialActive, nextStep, currentStep } = useTutorial();
  const { syncKey, triggerSync } = useDataSync();

  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const fetchData = useCallback(async (isInitialLoad = true) => {
    if (!user) return;
    if (isInitialLoad) setLoading(true);
    try {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('sales_opportunities')
        .select('*, distributor:profiles(*), opportunity_products:opportunity_products!left(*, product:products(id, name, sale_price, cost_price))')
        .eq('distributor_id', user.id)
        .order('visit_date', { ascending: false });
      if (activitiesError) throw activitiesError;
      setAllActivities(activitiesData || []);

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('distributor_id', user.id);
      if (customersError) throw customersError;
      setAllCustomers(customersData || []);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('distributor_id', user.id);
      if (productsError) throw productsError;
      setAllProducts(productsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao buscar dados', description: error.message, variant: 'destructive' });
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [user]);

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
    if (filters.activityStatus && filters.activityStatus !== 'all') activities = activities.filter(op => op.status === filters.activityStatus);
    if (filters.customerSearch) activities = activities.filter(op => op.customer_name && op.customer_name.toLowerCase().includes(filters.customerSearch.toLowerCase()));
    return activities;
  }, [allActivities, filters]);

  const handleOpenAddModal = (activity = null) => {
    setActivityToEdit(activity);
    setIsAddModalOpen(true);
    if (isTutorialActive && currentStep === 2) {
      setTimeout(() => nextStep(), 500); 
    }
  };
  
  const handleCardClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleEditClick = (activity) => {
    if(selectedActivity) setSelectedActivity(null);
    handleOpenAddModal(activity);
  };

  const handleDeleteClick = (activity) => {
    if(selectedActivity) setSelectedActivity(null);
    setActivityToDelete(activity);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_opportunity_and_related_tasks', {
        p_opportunity_id: activityToDelete.id
      });
      if (error) throw error;
      toast({
        title: 'Atividade Excluída!',
        description: 'A atividade foi removida com sucesso.',
        variant: "success"
      });
      triggerSync();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erro ao Excluir',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleteConfirmationOpen(false);
      setActivityToDelete(null);
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
      'Status': getStatusPortuguese(act.status),
      'Tipo': getActivityTypePortuguese(act.activity_type),
      'Valor Venda': act.status === 'sale_made' && act.sale_value != null ? act.sale_value : 'N/A',
      'Produtos': (act.opportunity_products && act.opportunity_products.length > 0) ?
        act.opportunity_products.map(op => `${op.product?.name || 'Desconhecido'} (Qtd:${op.quantity_sold})`).join('; ') : 'Nenhum',
      'Notas': act.notes || ''
    }));

    const filename = "relatorio_minhas_atividades_gsp";
    if (format === 'csv') exportToCSV(dataToExport, `${filename}.csv`);
    if (format === 'excel') exportToExcel(dataToExport, `${filename}.xlsx`, "Atividades");
    if (format === 'pdf') exportToPDF(dataToExport, `Relatório de Minhas Atividades (${formatDate(new Date())})`, ['Cliente', 'Data/Hora', 'Status', 'Tipo', 'Valor Venda'], `${filename}.pdf`);
    toast({ title: "Exportação Iniciada", description: `O relatório será baixado como ${format.toUpperCase()}.` });
  };
  
  const ActivitiesBoard = () => (
    loading ? (
      <div className="flex justify-center items-center py-16"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
    ) : (
      <Suspense fallback={<div className="flex justify-center items-center py-16"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
        <KanbanBoard 
          activities={filteredActivities} 
          onCardClick={handleCardClick} 
          enableDragAndDrop={false} 
        />
      </Suspense>
    )
  );
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
            <Trello className="w-8 h-8 text-primary" />
            <div>
                <h2 className="text-xl font-bold text-gradient">Vendas/Atividades</h2>
                <p className="text-sm text-muted-foreground">Visualize seu fluxo de vendas com o quadro Kanban.</p>
            </div>
        </div>
        <div className="flex gap-2 self-end sm:self-center">
          <TutorialStep
            step={2}
            content="Clique em 'Nova Atividade' para registrar suas vendas, visitas e contatos. É aqui que a mágica acontece!"
          >
            <Button onClick={() => handleOpenAddModal(null)} size="sm" className="bg-primary/80 hover:bg-primary"><PlusCircle className="w-4 h-4 mr-2" />Nova Atividade</Button>
          </TutorialStep>
        </div>
      </div>
      
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {isMobile && (
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm px-3 py-1.5 bg-secondary/80 hover:bg-secondary">
                  <Filter className="w-4 h-4 mr-2"/> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-gradient">Filtros de Atividades</SheetTitle>
                </SheetHeader>
                <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-primary" />}>
                  <div className="py-4">
                    <OpportunityFilters
                      filters={filters}
                      handleFilterChange={(name, value) => setFilters(prev => ({...prev, [name]: value}))}
                      distributors={[]} 
                      consultants={[]} 
                      fetchData={() => { fetchData(true); setIsFilterSheetOpen(false); }} 
                      loading={loading} 
                      showCustomerSearch={true}
                      showActivityStatus={true}
                      showConsultantFilter={false}
                      showDistributorTypeFilter={false}
                    />
                  </div>
                </Suspense>
              </SheetContent>
            </Sheet>
          )}
          {!isMobile && (
            <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-primary" />}>
              <OpportunityFilters
                filters={filters}
                handleFilterChange={(name, value) => setFilters(prev => ({...prev, [name]: value}))}
                distributors={null}
                consultants={null}
                fetchData={() => fetchData(true)}
                loading={loading}
                showCustomerSearch={true}
                showActivityStatus={true}
                showConsultantFilter={false}
                showDistributorTypeFilter={false}
              />
            </Suspense>
          )}
          <div className="flex gap-2 self-end sm:self-center">
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1.5" />CSV</Button>
            <Button onClick={() => handleExport('excel')} variant="outline" size="sm" className="text-xs"><Download className="w-3 h-3 mr-1.5" />Excel</Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" className="text-xs"><FileText className="w-3 h-3 mr-1.5" />PDF</Button>
          </div>
       </div>

      <div className="overflow-x-auto w-full pb-4 custom-scrollbar">
          <ActivitiesBoard />
      </div>
      
      <Suspense fallback={<div>Carregando Modal...</div>}>
        <AddSalesActivityModal 
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setActivityToEdit(null); }}
          activityData={activityToEdit}
          customers={allCustomers}
          products={allProducts}
          onActivityAdded={triggerSync}
        />
      </Suspense>

      <Suspense fallback={<div>Carregando Detalhes...</div>}>
        <ActivityDetailsModal
          activity={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </Suspense>

      <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a atividade com o cliente <strong>"{activityToDelete?.customer_name}"</strong>? Esta ação não pode ser desfeita e removerá todos os dados relacionados, incluindo produtos da venda e tarefas de IA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ActivitiesTab;