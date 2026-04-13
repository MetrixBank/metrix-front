import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, AlertTriangle, Loader2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useCustomerTaskSync } from '@/hooks/useCustomerTaskSync';
import { detectDuplicateCustomers } from '@/lib/customerDeduplication';
import { DuplicateCustomersModal } from './DuplicateCustomersModal';
import { calculateClientIntelligence } from '@/lib/clientScoring';
import { CustomerFormFields } from '@/components/add-sales-activity/CustomerFormFields';
import {
  ClientHeader,
  ClientToolbar,
  ClientsContent,
  ClientExcelExportButton,
  customerSchema,
} from '@/components/Clients';
import { mockProcessedCustomers, USE_CUSTOMERS_MOCK } from '@/mock/customersMock';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const CustomersTab = () => {
  const { user } = useAuth();
  const { region, t } = useLocalization();
  const isUSA = region === 'USA';
  const { triggerSync } = useDataSync();

  const { customers: rawCustomers, loading: syncLoading, refetch } = useCustomerTaskSync();
  const [processedCustomers, setProcessedCustomers] = useState(() =>
    USE_CUSTOMERS_MOCK ? mockProcessedCustomers : [],
  );
  const [loadingProcessing, setLoadingProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  const [viewMode, setViewMode] = useState('table');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [columns, setColumns] = useState([
    { id: 'name', label: 'Nome / Cliente', visible: true },
    { id: 'cpf', label: isUSA ? 'SSN/EIN' : 'CPF/CNPJ', visible: true },
    { id: 'phone', label: 'Telefone', visible: true },
    { id: 'contact', label: 'Email', visible: true },
    { id: 'address', label: 'Endereço', visible: false },
    { id: 'temperature', label: 'Temperatura', visible: true },
    { id: 'score', label: 'Score', visible: true },
    { id: 'ltv', label: 'Total Comprado', visible: true },
    { id: 'last_sale', label: 'Última Venda', visible: true },
  ]);

  useEffect(() => {
    setColumns((cols) =>
      cols.map((c) => (c.id === 'cpf' ? { ...c, label: isUSA ? 'SSN/EIN' : 'CPF/CNPJ' } : c)),
    );
  }, [isUSA]);

  const methods = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_name: '',
      customer_cpf_cnpj: '',
      customer_phone: '',
      customer_email: '',
      customer_address: '',
      customer_cep: '',
      customer_address_number: '',
      customer_address_complement: '',
      customer_address_neighborhood: '',
      customer_address_city: '',
      customer_address_state: '',
      customer_birth_date: '',
      customer_company: '',
      customer_position: '',
      is_new_customer: true,
    },
  });

  const { reset, handleSubmit } = methods;

  const processCustomerData = useCallback((customer, activities) => {
    const customerActivities = activities.filter(
      (a) =>
        a.customer_id === customer.id ||
        (a.customer_name && customer.name && a.customer_name.toLowerCase() === customer.name.toLowerCase()),
    );

    const sales = customerActivities.filter((a) => a.status === 'sale_made');
    const totalPurchased = sales.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0);
    const dates = customerActivities.map((s) => new Date(s.visit_date).getTime());
    const lastSaleDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

    const { score, temperature, potential } = calculateClientIntelligence({
      lastContactDate: lastSaleDate,
      totalPurchases: sales.length,
      ltv: totalPurchased,
      totalVisits: customerActivities.length,
    });

    return {
      ...customer,
      intelligence: {
        score,
        temperature,
        totalPurchased,
        lastSaleDate,
        potential,
      },
    };
  }, []);

  useEffect(() => {
    if (USE_CUSTOMERS_MOCK) {
      setProcessedCustomers(mockProcessedCustomers);
      setDuplicateGroups([]);
      return;
    }

    const process = async () => {
      if (!user || rawCustomers.length === 0) {
        setProcessedCustomers([]);
        setDuplicateGroups([]);
        return;
      }
      setLoadingProcessing(true);
      try {
        const { data: actData } = await supabase
          .from('sales_opportunities')
          .select('id, customer_id, customer_name, status, sale_value, visit_date')
          .eq('distributor_id', user.id);

        const processed = rawCustomers.map((c) => processCustomerData(c, actData || []));
        const duplicates = detectDuplicateCustomers(processed);
        setDuplicateGroups(duplicates);

        const tempOrder = { Hot: 0, 'At Risk': 1, Warm: 2, Cold: 3 };
        processed.sort((a, b) => {
          const tempDiff = tempOrder[a.intelligence.temperature] - tempOrder[b.intelligence.temperature];
          if (tempDiff !== 0) return tempDiff;
          return a.name.localeCompare(b.name);
        });
        setProcessedCustomers(processed);
      } catch (err) {
        console.error('Processing error', err);
      } finally {
        setLoadingProcessing(false);
      }
    };
    process();
  }, [rawCustomers, user, processCustomerData]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return processedCustomers;
    const lowerTerm = searchTerm.toLowerCase();
    return processedCustomers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(lowerTerm)) ||
        (c.phone && c.phone.includes(lowerTerm)) ||
        (c.cpf_cnpj && c.cpf_cnpj.includes(lowerTerm)),
    );
  }, [processedCustomers, searchTerm]);

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    reset({
      customer_name: customer.name || '',
      customer_cpf_cnpj: customer.cpf_cnpj || '',
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      customer_address: customer.address || '',
      customer_cep: customer.zip_code || '',
      customer_address_number: customer.address_number || '',
      customer_address_complement: customer.address_complement || '',
      customer_address_neighborhood: customer.address_neighborhood || '',
      customer_address_city: customer.address_city || '',
      customer_address_state: customer.address_state || '',
      customer_birth_date: customer.birth_date || '',
      customer_company: customer.company || '',
      customer_position: customer.position || '',
      is_new_customer: true,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!editingCustomer) return;

    setIsSubmitting(true);

    try {
      const cleanCpf = data.customer_cpf_cnpj ? data.customer_cpf_cnpj.replace(/\D/g, '') : null;
      const cleanZip = data.customer_cep ? data.customer_cep.replace(/\D/g, '') : null;

      const payload = {
        name: data.customer_name,
        cpf_cnpj: cleanCpf || null,
        phone: data.customer_phone,
        email: data.customer_email || null,
        address: data.customer_address || null,
        zip_code: cleanZip || null,
        address_number: data.customer_address_number || null,
        address_complement: data.customer_address_complement || null,
        address_neighborhood: data.customer_address_neighborhood || null,
        address_city: data.customer_address_city || null,
        address_state: data.customer_address_state || null,
        birth_date: data.customer_birth_date || null,
        company: data.customer_company || null,
        position: data.customer_position || null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedData, error } = await supabase.from('customers').update(payload).eq('id', editingCustomer.id).select();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados do cliente atualizados corretamente.',
        className: 'bg-emerald-500 border-none text-white',
      });

      if (updatedData && refetch) await refetch();
      triggerSync();
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (e, customer) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerToDelete.id);
      if (error) throw error;
      toast({ title: 'Cliente excluído', description: 'O registro foi removido.' });
      triggerSync();
      refetch();
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const toggleColumn = (id) => setColumns((cols) => cols.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));

  const isLoading = USE_CUSTOMERS_MOCK ? false : syncLoading || loadingProcessing;

  if (isLoading && processedCustomers.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const title = isUSA ? 'Client Management' : 'Gestão de Clientes';
  const subtitle = isUSA ? 'Track interactions and intelligence.' : 'Edite e gerencie sua carteira de clientes.';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen space-y-6 pb-20 md:pb-0">
      <ClientHeader
        title={title}
        subtitle={subtitle}
        actions={
          duplicateGroups.length > 0 ? (
            <Button
              variant="outline"
              onClick={() => setShowDuplicatesModal(true)}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Layers className="mr-2 h-4 w-4" />
              Duplicatas
              <Badge className="ml-2 h-5 bg-amber-500 px-1.5 text-white">{duplicateGroups.length}</Badge>
            </Button>
          ) : null
        }
      />

      <ClientToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Pesquisar cliente (nome, telefone, CPF)..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        columns={columns}
        onToggleColumn={toggleColumn}
        toolbarEnd={<ClientExcelExportButton customers={filteredCustomers} isUSA={isUSA} />}
      />

      <div className="min-h-[400px]">
        <ClientsContent
          hasRows={filteredCustomers.length > 0}
          searchTerm={searchTerm}
          viewMode={viewMode}
          columns={columns}
          customers={filteredCustomers}
          emptyNoSearchTitle="Nenhum cliente na carteira"
          emptyNoSearchDescription="Sua carteira ainda não tem clientes. Eles aparecerão aqui com score e temperatura assim que forem cadastrados."
          emptySearchTitle="Nenhum cliente encontrado"
          emptySearchDescription="Nenhum cliente corresponde à busca atual. Tente outro nome, telefone ou documento."
          onEdit={openEditModal}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      <DuplicateCustomersModal
        isOpen={showDuplicatesModal}
        onClose={setShowDuplicatesModal}
        duplicateGroups={duplicateGroups}
        onRefresh={() => {
          refetch();
          triggerSync();
        }}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gradient">
              <Edit className="h-5 w-5 text-primary" />
              {isUSA ? 'Edit Client' : 'Editar Cliente'}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <CustomerFormFields region={isUSA ? 'USA' : 'BR'} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary/90 hover:bg-primary">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isUSA ? 'Save' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-border/50 bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> {isUSA ? 'Confirm Delete' : 'Excluir Cliente'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isUSA
                ? `Are you sure you want to delete "${customerToDelete?.name}"?`
                : `Tem certeza que deseja excluir "${customerToDelete?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {t('cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomersTab;
