import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Filter,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { getStatusPortuguese, getActivityTypePortuguese, formatDate, cn } from '@/lib/utils';
import TutorialStep from '@/components/tutorial/TutorialStep';
import { useTutorial } from '@/contexts/TutorialContext';
import useMediaQuery from '@/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { useDataSync } from '@/contexts/DataSyncContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const KanbanBoard = lazy(() => import('@/components/admin/activities/KanbanBoard'));
const ActivityDetailsModal = lazy(() => import('@/components/admin/activities/ActivityDetailsModal'));
const AddSalesActivityModal = lazy(() => import('@/components/AddSalesActivityModal'));

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'scheduled', label: 'Agendada' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'sale_made', label: 'Venda realizada' },
  { value: 'completed_no_sale', label: 'Concluída (S/ venda)' },
  { value: 'postponed', label: 'Adiada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const inputSurfaceClass =
  'h-9 border-0 bg-[#151025] font-plusJakarta text-sm text-white/90 shadow-none ring-0 focus-visible:ring-1 focus-visible:ring-violet-400/40 placeholder:text-white/35';

const ActivitiesTab = () => {
  const { user } = useAuth();
  const [allActivities, setAllActivities] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    distributorId: 'all',
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

  const resolveTeamIds = useCallback(async () => {
    if (!user?.id) return [user?.id].filter(Boolean);
    try {
      const { data, error } = await supabase.rpc('get_user_descendants_and_self', {
        p_user_id: user.id,
      });
      if (error) throw error;
      const ids = [...new Set((data || []).map((d) => d.id))];
      if (ids.length === 0) return [user.id];
      return ids;
    } catch {
      return [user.id];
    }
  }, [user?.id]);

  const fetchData = useCallback(
    async (isInitialLoad = true) => {
      if (!user) return;
      if (isInitialLoad) setLoading(true);
      try {
        const ids = await resolveTeamIds();

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', ids);
        setTeamMembers(profilesData || []);

        const { data: activitiesData, error: activitiesError } = await supabase
          .from('sales_opportunities')
          .select(
            '*, distributor:profiles(*), opportunity_products:opportunity_products!left(*, product:products(id, name, sale_price, cost_price))'
          )
          .in('distributor_id', ids)
          .order('visit_date', { ascending: false });
        if (activitiesError) throw activitiesError;
        setAllActivities(activitiesData || []);

        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .in('distributor_id', ids);
        if (customersError) throw customersError;
        setAllCustomers(customersData || []);

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('distributor_id', ids);
        if (productsError) throw productsError;
        setAllProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erro ao buscar dados',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [user, resolveTeamIds]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, syncKey]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredActivities = useMemo(() => {
    let activities = [...allActivities];
    if (filters.distributorId && filters.distributorId !== 'all') {
      activities = activities.filter((op) => op.distributor_id === filters.distributorId);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      activities = activities.filter(
        (op) => op.visit_date && new Date(op.visit_date) >= startDate
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
      activities = activities.filter(
        (op) => op.visit_date && new Date(op.visit_date) <= endDate
      );
    }
    if (filters.activityStatus && filters.activityStatus !== 'all') {
      activities = activities.filter((op) => op.status === filters.activityStatus);
    }
    if (filters.customerSearch?.trim()) {
      const q = filters.customerSearch.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      activities = activities.filter((op) => {
        const nameMatch =
          op.customer_name && op.customer_name.toLowerCase().includes(q);
        const cpfRaw = (op.customer_cpf_cnpj || '').replace(/\D/g, '');
        const cpfMatch = qDigits.length >= 3 && cpfRaw.includes(qDigits);
        return nameMatch || cpfMatch;
      });
    }
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
    if (selectedActivity) setSelectedActivity(null);
    handleOpenAddModal(activity);
  };

  const handleDeleteClick = (activity) => {
    if (selectedActivity) setSelectedActivity(null);
    setActivityToDelete(activity);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      const { error } = await supabase.rpc('delete_opportunity_and_related_tasks', {
        p_opportunity_id: activityToDelete.id,
      });
      if (error) throw error;
      toast({
        title: 'Atividade excluída!',
        description: 'A atividade foi removida com sucesso.',
        variant: 'success',
      });
      triggerSync();
      fetchData(false);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erro ao excluir',
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
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Por favor, ajuste seus filtros ou adicione atividades.',
        variant: 'destructive',
      });
      return;
    }
    const dataToExport = filteredActivities.map((act) => ({
      Cliente: act.customer_name || 'N/A',
      'Data/Hora': formatDate(act.visit_date, act.visit_time),
      Status: getStatusPortuguese(act.status),
      Tipo: getActivityTypePortuguese(act.activity_type),
      'Valor Venda':
        act.status === 'sale_made' && act.sale_value != null ? act.sale_value : 'N/A',
      Produtos:
        act.opportunity_products && act.opportunity_products.length > 0
          ? act.opportunity_products
              .map(
                (op) =>
                  `${op.product?.name || 'Desconhecido'} (Qtd:${op.quantity_sold})`
              )
              .join('; ')
          : 'Nenhum',
      Notas: act.notes || '',
    }));

    const filename = 'relatorio_minhas_atividades_gsp';
    if (format === 'csv') exportToCSV(dataToExport, `${filename}.csv`);
    if (format === 'excel') exportToExcel(dataToExport, `${filename}.xlsx`, 'Atividades');
    if (format === 'pdf')
      exportToPDF(
        dataToExport,
        `Relatório de Minhas Atividades (${formatDate(new Date())})`,
        ['Cliente', 'Data/Hora', 'Status', 'Tipo', 'Valor Venda'],
        `${filename}.pdf`
      );
    toast({
      title: 'Exportação iniciada',
      description: `O relatório será baixado como ${format.toUpperCase()}.`,
    });
  };

  const FiltersInner = ({ onApply, layout = 'row' }) => (
    <div
      className={cn(
        'w-full gap-3 pb-1 font-plusJakarta',
        layout === 'row'
          ? 'flex min-w-0 flex-nowrap items-end overflow-x-auto'
          : 'flex flex-col'
      )}
    >
      <div className={cn('flex flex-col gap-1', layout === 'column' && 'min-w-0 w-full')}>
        <Label className="text-[10px] font-medium uppercase tracking-wider text-violet-300/50">
          Distribuidor / Equipe
        </Label>
        <Select
          value={filters.distributorId}
          onValueChange={(v) => handleFilterChange('distributorId', v)}
        >
          <SelectTrigger className={cn(inputSurfaceClass, layout === 'row' && 'min-w-[140px]')}>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="border-violet-500/20 bg-[#1a1228] text-white">
            <SelectItem value="all">Todos</SelectItem>
            {teamMembers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name || d.email || d.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          'flex min-w-[140px] flex-col gap-1',
          layout === 'column' && 'w-full min-w-0'
        )}
      >
        <Label className="text-[10px] font-medium uppercase tracking-wider text-violet-300/50">
          Data início
        </Label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className={inputSurfaceClass}
        />
      </div>

      <div
        className={cn(
          'flex min-w-[140px] flex-col gap-1',
          layout === 'column' && 'w-full min-w-0'
        )}
      >
        <Label className="text-[10px] font-medium uppercase tracking-wider text-violet-300/50">
          Data fim
        </Label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className={inputSurfaceClass}
        />
      </div>

      <div
        className={cn(
          'flex min-w-[160px] flex-1 flex-col gap-1',
          layout === 'column' && 'w-full min-w-0'
        )}
      >
        <Label className="text-[10px] font-medium uppercase tracking-wider text-violet-300/50">
          Cliente
        </Label>
        <Input
          type="text"
          placeholder="Nome/CPF..."
          value={filters.customerSearch}
          onChange={(e) => handleFilterChange('customerSearch', e.target.value)}
          className={inputSurfaceClass}
        />
      </div>

      <div
        className={cn(
          'flex min-w-[140px] flex-col gap-1',
          layout === 'column' && 'w-full min-w-0'
        )}
      >
        <Label className="text-[10px] font-medium uppercase tracking-wider text-violet-300/50">
          Status
        </Label>
        <Select
          value={filters.activityStatus}
          onValueChange={(v) => handleFilterChange('activityStatus', v)}
        >
          <SelectTrigger className={cn(inputSurfaceClass, layout === 'row' && 'min-w-[140px]')}>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="border-violet-500/20 bg-[#1a1228] text-white">
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn('flex flex-col gap-1 pb-0.5', layout === 'column' && 'w-full')}
      >
        <span className="text-[10px] uppercase tracking-wider text-transparent">—</span>
        <Button
          type="button"
          size="sm"
          disabled={loading}
          className={cn(
            'h-9 shrink-0 gap-2 rounded-lg border-0 bg-gradient-to-r from-[#c799ff] to-[#bc87fe] px-4 font-plusJakarta text-sm font-semibold text-white shadow-[0_0_20px_-2px_rgba(199,153,255,0.55)] hover:brightness-110 disabled:opacity-60',
            layout === 'column' && 'w-full'
          )}
          onClick={() => {
            if (onApply) onApply();
            fetchData(false);
          }}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Aplicar
        </Button>
      </div>
    </div>
  );

  const ActivitiesBoard = () =>
    loading ? (
      <div className="flex justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
      </div>
    ) : (
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
          </div>
        }
      >
        <KanbanBoard
          activities={filteredActivities}
          onCardClick={handleCardClick}
          enableDragAndDrop={false}
          appearance="nocturnal"
        />
      </Suspense>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-['Manrope'] text-2xl font-bold tracking-tight text-white">
            Vendas
          </h2>
          <p className="mt-1 font-plusJakarta text-sm text-violet-200/55">
            Gestão de oportunidades e funil de conversão
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-['Manrope'] text-sm font-bold bg-[#1e1535] text-violet-100/95 transition hover:bg-[#251d42]"
              >
                <Download className="h-4 w-4 shrink-0 opacity-90" />
                Exportar
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border border-violet-500/20 bg-[#1a1228] text-violet-100"
            >
              <DropdownMenuItem
                className="cursor-pointer font-plusJakarta focus:bg-violet-500/20 focus:text-white"
                onClick={() => handleExport('csv')}
              >
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-plusJakarta focus:bg-violet-500/20 focus:text-white"
                onClick={() => handleExport('excel')}
              >
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-plusJakarta focus:bg-violet-500/20 focus:text-white"
                onClick={() => handleExport('pdf')}
              >
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TutorialStep
            step={2}
            content="Clique em 'Nova Atividade' para registrar suas vendas, visitas e contatos. É aqui que a mágica acontece!"
          >
            <button
              type="button"
              onClick={() => handleOpenAddModal(null)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-['Manrope'] text-sm font-bold bg-[#d4b5ff] text-[#1a0d2e] shadow-[0_0_24px_-4px_rgba(199,153,255,0.65)] transition hover:brightness-105"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              Nova Atividade
            </button>
          </TutorialStep>
        </div>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-3">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-fit border-violet-500/30 bg-violet-950/30 font-plusJakarta text-violet-100"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-violet-500/20 bg-[#120a1c] sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle className="font-['Manrope'] text-lg text-white">
                  Filtros
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <FiltersInner
                  layout="column"
                  onApply={() => setIsFilterSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <FiltersInner />
      )}

      <div className="custom-scrollbar w-full min-w-0 pb-4">
        <ActivitiesBoard />
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      <Suspense fallback={<div className="font-plusJakarta text-violet-300/60">Carregando…</div>}>
        <AddSalesActivityModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setActivityToEdit(null);
          }}
          activityData={activityToEdit}
          customers={allCustomers}
          products={allProducts}
          onActivityAdded={() => {
            triggerSync();
            fetchData(false);
          }}
        />
      </Suspense>

      <Suspense fallback={<div className="font-plusJakarta text-violet-300/60">Carregando…</div>}>
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
              <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a atividade com o cliente{' '}
              <strong>&quot;{activityToDelete?.customer_name}&quot;</strong>? Esta ação não pode ser
              desfeita e removerá todos os dados relacionados, incluindo produtos da venda e tarefas
              de IA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ActivitiesTab;
