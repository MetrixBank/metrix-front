import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useForm, FormProvider, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, Edit, Trash2, AlertTriangle, 
  Phone, MapPin, Loader2, Calendar, LayoutGrid, List as ListIcon, 
  Zap, Thermometer, Clock, Settings2, ShieldCheck, Layers, Mail, Briefcase, User, Search, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, formatCpfCnpj } from '@/lib/utils';
import { calculateClientIntelligence } from '@/lib/clientScoring';
import { toast } from '@/components/ui/use-toast';
import { useCustomerTaskSync } from '@/hooks/useCustomerTaskSync';
import { detectDuplicateCustomers, checkCustomerExists } from '@/lib/customerDeduplication';
import { DuplicateCustomersModal } from './DuplicateCustomersModal';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import { useCEPAutofill } from '@/hooks/useCEPAutofill';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import InputMask from 'react-input-mask';
import { CustomerFormFields } from '@/components/add-sales-activity/CustomerFormFields';

const TemperatureBadge = ({ temp }) => {
    const config = {
        'Hot': { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Zap, label: 'Quente' },
        'Warm': { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Thermometer, label: 'Morno' },
        'Cold': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'Frio' },
        'At Risk': { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Em Risco' }
    };
    const style = config[temp] || config['Cold'];
    const Icon = style.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 border", style.color)}>
            <Icon className="w-3 h-3" /> {style.label}
        </Badge>
    );
};

const customerSchema = z.object({
  customer_name: z.string().min(1, "Nome é obrigatório"),
  customer_cpf_cnpj: z.string().optional(),
  customer_phone: z.string().min(1, "Telefone é obrigatório"),
  customer_email: z.string().email("Email inválido").optional().or(z.literal('')),
  customer_address: z.string().optional(),
  customer_cep: z.string().optional(),
  customer_address_number: z.string().optional(),
  customer_address_complement: z.string().optional(),
  customer_address_neighborhood: z.string().optional(),
  customer_address_city: z.string().optional(),
  customer_address_state: z.string().optional(),
  customer_birth_date: z.string().optional().nullable(),
  customer_company: z.string().optional(),
  customer_position: z.string().optional(),
  // For modal compatibility
  is_new_customer: z.boolean().default(true),
  customer_id: z.string().optional().nullable(),
});

const CustomersTab = () => {
  const { user } = useAuth();
  const { region, t } = useLocalization();
  const isUSA = region === 'USA';
  const { triggerSync } = useDataSync();

  const { customers: rawCustomers, loading: syncLoading, refetch } = useCustomerTaskSync();
  const [processedCustomers, setProcessedCustomers] = useState([]);
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

  // UPDATED COLUMNS: Separated CPF and Phone
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
        is_new_customer: true
    }
  });

  const { reset, handleSubmit, register, control, formState: { errors } } = methods;

  const processCustomerData = useCallback((customer, activities) => {
    const customerActivities = activities.filter(a => 
      a.customer_id === customer.id || 
      (a.customer_name && customer.name && a.customer_name.toLowerCase() === customer.name.toLowerCase())
    );
    
    const sales = customerActivities.filter(a => a.status === 'sale_made');
    const totalPurchased = sales.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0);
    const dates = customerActivities.map(s => new Date(s.visit_date).getTime());
    const lastSaleDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;
    
    const { score, temperature, potential } = calculateClientIntelligence({
        lastContactDate: lastSaleDate,
        totalPurchases: sales.length, 
        ltv: totalPurchased,
        totalVisits: customerActivities.length
    });

    return {
      ...customer,
      intelligence: {
        score,
        temperature,
        totalPurchased,
        lastSaleDate,
        potential
      }
    };
  }, []);

  useEffect(() => {
      const process = async () => {
          if (!user || rawCustomers.length === 0) {
              setProcessedCustomers([]);
              setDuplicateGroups([]);
              return;
          }
          setLoadingProcessing(true);
          try {
             const { data: actData } = await supabase.from('sales_opportunities')
                .select('id, customer_id, customer_name, status, sale_value, visit_date')
                .eq('distributor_id', user.id);
             
             const processed = rawCustomers.map(c => processCustomerData(c, actData || []));
             const duplicates = detectDuplicateCustomers(processed);
             setDuplicateGroups(duplicates);

             const tempOrder = { 'Hot': 0, 'At Risk': 1, 'Warm': 2, 'Cold': 3 };
             processed.sort((a,b) => {
                const tempDiff = tempOrder[a.intelligence.temperature] - tempOrder[b.intelligence.temperature];
                if (tempDiff !== 0) return tempDiff;
                return a.name.localeCompare(b.name);
             });
             setProcessedCustomers(processed);
          } catch (err) {
              console.error("Processing error", err);
          } finally {
              setLoadingProcessing(false);
          }
      };
      process();
  }, [rawCustomers, user, processCustomerData]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return processedCustomers;
    const lowerTerm = searchTerm.toLowerCase();
    return processedCustomers.filter(c => 
      (c.name && c.name.toLowerCase().includes(lowerTerm)) ||
      (c.phone && c.phone.includes(lowerTerm)) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(lowerTerm))
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
        is_new_customer: true // Force 'new' mode UI style but we handle update
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!editingCustomer) return;
    
    console.group("🚀 Iniciando salvamento do cliente");
    console.log("📝 Dados do formulário:", data);
    setIsSubmitting(true);
    
    try {
      // Data Cleaning
      const cleanCpf = data.customer_cpf_cnpj ? data.customer_cpf_cnpj.replace(/\D/g, '') : null;
      const cleanZip = data.customer_cep ? data.customer_cep.replace(/\D/g, '') : null;
      // const phoneDigits = data.customer_phone ? data.customer_phone.replace(/\D/g, '') : '';

      // Prepare Payload
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
          updated_at: new Date().toISOString()
      };
      
      console.log("💾 Payload preparado para update:", payload);
      
      const { data: updatedData, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', editingCustomer.id)
        .select();

      if (error) {
          console.error("❌ Erro Supabase UPDATE:", error);
          throw error;
      }
      
      console.log("✅ Sucesso! Cliente atualizado:", updatedData);
      toast({ 
          title: "Sucesso", 
          description: "Dados do cliente atualizados corretamente.", 
          className: "bg-emerald-500 border-none text-white" 
      });
      
      if (refetch) await refetch(); 
      triggerSync(); 
      setIsModalOpen(false);
      setEditingCustomer(null);

    } catch (error) {
      console.error("❌ Exceção capturada no onSubmit:", error);
      toast({ 
          title: "Erro ao salvar", 
          description: error.message || "Verifique os dados e tente novamente.", 
          variant: "destructive" 
      });
    } finally {
        setIsSubmitting(false);
        console.groupEnd();
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
      toast({ title: "Cliente excluído", description: "O registro foi removido." });
      triggerSync();
      refetch();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const toggleColumn = (id) => setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));

  const isLoading = syncLoading || loadingProcessing;

  if (isLoading && processedCustomers.length === 0) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 min-h-screen pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <Users className="w-8 h-8 text-violet-300" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                        {isUSA ? 'Client Management' : 'Gestão de Clientes'}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Sincronização em tempo real ativa.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </h1>
                    <p className="text-white/50 text-sm">
                        {isUSA ? 'Track interactions and intelligence.' : 'Edite e gerencie sua carteira de clientes.'}
                    </p>
                </div>
            </div>
        </div>
        
        <div className="flex gap-2">
            {duplicateGroups.length > 0 && (
                <Button 
                    variant="outline" 
                    onClick={() => setShowDuplicatesModal(true)} 
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                    <Layers className="w-4 h-4 mr-2" />
                    Duplicatas
                    <Badge className="ml-2 bg-amber-500 text-white h-5 px-1.5">{duplicateGroups.length}</Badge>
                </Button>
            )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-[#161922] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg shadow-black/20 sticky top-4 z-30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="Pesquisar cliente (nome, telefone, CPF)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#0B0E14] border-white/10 text-white w-full focus:ring-violet-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
              <div className="bg-[#0B0E14] rounded-lg p-1 flex border border-white/10">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white'}`} title="Grade">
                      <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white'}`} title="Tabela">
                      <ListIcon className="w-4 h-4" />
                  </button>
              </div>
              
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="border-white/10 bg-[#0B0E14] text-white/70 hover:text-white">
                          <Settings2 className="w-4 h-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#161922] border-white/10 text-white w-56">
                      <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10"/>
                      {columns.map(col => (
                          <DropdownMenuCheckboxItem 
                              key={col.id} checked={col.visible} onCheckedChange={() => toggleColumn(col.id)}
                              className="focus:bg-white/10 focus:text-white"
                          >
                              {col.label}
                          </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
      </div>

      <div className="min-h-[400px]">
        {filteredCustomers.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-white/30 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente na carteira"}
              </p>
           </div>
        ) : (
          <AnimatePresence mode="wait">
             {viewMode === 'grid' ? (
                <motion.div 
                    key="grid"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {filteredCustomers.map(customer => (
                        <ClientCard 
                            key={customer.id} 
                            customer={customer} 
                            onEdit={() => openEditModal(customer)} 
                            onDelete={(e) => handleDeleteRequest(e, customer)}
                        />
                    ))}
                </motion.div>
             ) : (
                <motion.div 
                    key="table"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/10 overflow-hidden bg-[#161922]/50 backdrop-blur-sm"
                >
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                {columns.map(col => col.visible && (
                                    <TableHead key={col.id} className="text-white/60 font-semibold text-xs uppercase tracking-wider h-12">
                                        {col.label}
                                    </TableHead>
                                ))}
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map(customer => (
                                <ClientTableRow 
                                    key={customer.id} 
                                    customer={customer} 
                                    columns={columns} 
                                    onEdit={() => openEditModal(customer)}
                                    onDelete={(e) => handleDeleteRequest(e, customer)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </motion.div>
             )}
          </AnimatePresence>
        )}
      </div>

      {/* Duplicate Management Modal */}
      <DuplicateCustomersModal 
        isOpen={showDuplicatesModal} 
        onClose={setShowDuplicatesModal}
        duplicateGroups={duplicateGroups}
        onRefresh={() => {
            refetch();
            triggerSync();
        }}
      />

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#161922] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-violet-400"/>
              {isUSA ? 'Edit Client' : 'Editar Cliente'}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                {/* Use the shared component here to ensure consistency */}
                <CustomerFormFields region={isUSA ? 'USA' : 'BR'} />
                
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10">{t('cancel')}</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isUSA ? 'Save' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#161922] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {isUSA ? 'Confirm Delete' : 'Excluir Cliente'}</DialogTitle>
            <DialogDescription className="text-white/60">
               {isUSA ? `Are you sure you want to delete "${customerToDelete?.name}"?` : `Tem certeza que deseja excluir "${customerToDelete?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10">{t('cancel')}</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ClientCard = ({ customer, onEdit, onDelete }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onEdit}
      className="group relative bg-[#161922]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 cursor-pointer overflow-hidden shadow-lg hover:shadow-violet-900/20 transition-all flex flex-col justify-between h-full"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                        <AvatarFallback className="bg-violet-900/50 text-violet-200 text-xs">
                        {customer.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <h3 className="font-bold text-white text-sm truncate max-w-[140px]">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-white/40 flex items-center truncate">
                                <Phone className="w-3 h-3 mr-1" /> {customer.phone || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                <TemperatureBadge temp={customer.intelligence.temperature} />
            </div>
            
            <div className="text-[10px] text-white/30 mb-2 truncate">
               <Fingerprint className="w-3 h-3 inline mr-1 opacity-50"/> 
               {customer.cpf_cnpj ? formatCpfCnpj(customer.cpf_cnpj) : 'CPF não informado'}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase">Total Comprado</p>
                    <p className="text-xs font-bold text-emerald-400">{formatCurrency(customer.intelligence.totalPurchased)}</p>
                </div>
                 <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <p className="text-[9px] text-white/40 uppercase">Score</p>
                    <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-violet-400">{customer.intelligence.score}</p>
                        <span className="text-[9px] text-white/30">/100</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-white/50 border-t border-white/5 pt-3">
                 <span className="flex items-center gap-1">
                     <Calendar className="w-3 h-3"/> Última: {customer.intelligence.lastSaleDate ? formatDate(customer.intelligence.lastSaleDate) : '-'}
                 </span>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-rose-400" onClick={onDelete}>
                     <Trash2 className="w-3.5 h-3.5"/>
                 </Button>
            </div>
        </div>
    </motion.div>
);

const ClientTableRow = ({ customer, columns, onEdit, onDelete }) => (
    <TableRow className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group" onClick={onEdit}>
        {columns.find(c => c.id === 'name' && c.visible) && (
            <TableCell className="font-medium text-white">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-white/5">
                        <AvatarFallback className="text-[10px] bg-white/5 text-white/60">{customer.name?.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <span>{customer.name}</span>
                </div>
            </TableCell>
        )}
        {columns.find(c => c.id === 'cpf' && c.visible) && (
            <TableCell className="text-xs text-white/60 font-mono">
                {customer.cpf_cnpj ? formatCpfCnpj(customer.cpf_cnpj) : '-'}
            </TableCell>
        )}
        {columns.find(c => c.id === 'phone' && c.visible) && (
            <TableCell className="text-xs text-white/70">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3 opacity-50"/> {customer.phone || '-'}</span>
            </TableCell>
        )}
        {columns.find(c => c.id === 'contact' && c.visible) && (
            <TableCell>
                <div className="flex flex-col text-xs text-white/70">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 opacity-50"/> {customer.email || '-'}</span>
                </div>
            </TableCell>
        )}
        {columns.find(c => c.id === 'address' && c.visible) && (
            <TableCell>
                 <div className="flex items-center gap-1 text-xs text-white/60">
                    <MapPin className="w-3 h-3 opacity-50"/>
                    <span className="truncate max-w-[200px]" title={
                        [customer.address, customer.address_number, customer.address_neighborhood, customer.address_city, customer.address_state]
                        .filter(Boolean).join(', ')
                    }>
                        {[customer.address, customer.address_number, customer.address_neighborhood, customer.address_city, customer.address_state]
                        .filter(Boolean).join(', ') || '-'}
                    </span>
                 </div>
            </TableCell>
        )}
        {columns.find(c => c.id === 'temperature' && c.visible) && (
            <TableCell><TemperatureBadge temp={customer.intelligence.temperature} /></TableCell>
        )}
        {columns.find(c => c.id === 'score' && c.visible) && (
            <TableCell>
                 <div className="flex items-center gap-1">
                     <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                         <div className={`h-full ${customer.intelligence.score > 70 ? 'bg-emerald-500' : customer.intelligence.score > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${customer.intelligence.score}%` }} />
                     </div>
                     <span className="text-xs text-white/60">{customer.intelligence.score}</span>
                 </div>
            </TableCell>
        )}
        {columns.find(c => c.id === 'ltv' && c.visible) && (
            <TableCell className="text-emerald-400 font-mono text-xs font-medium">{formatCurrency(customer.intelligence.totalPurchased)}</TableCell>
        )}
        {columns.find(c => c.id === 'last_sale' && c.visible) && (
            <TableCell className="text-white/60 text-xs">{customer.intelligence.lastSaleDate ? formatDate(customer.intelligence.lastSaleDate) : '-'}</TableCell>
        )}
        <TableCell className="text-right">
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit className="w-4 h-4"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-rose-400" onClick={onDelete}>
                    <Trash2 className="w-4 h-4"/>
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export default CustomersTab;