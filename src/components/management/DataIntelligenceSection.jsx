import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Search, Filter, LayoutGrid, 
  List as ListIcon, Settings2, Plus, Download, Loader2, X,
  TrendingUp, Activity, AlertTriangle, Wallet, Kanban, Zap,
  RotateCcw, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/utils';
import { calculateClientIntelligence } from '@/lib/clientScoring';
import { Badge } from '@/components/ui/badge';
import { exportToExcel } from '@/lib/exportUtils';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import { useCustomerTaskSync } from '@/hooks/useCustomerTaskSync'; // NEW IMPORT
import { cn } from '@/lib/utils';

// Import sub-components
import { ClientCard, ClientTableRow, ClientDetailModal, AddClientModal, CopilotStatCard, CopilotKanbanBoard, RevenueForecastChart } from './intelligence/ClientIntelligenceComponents';

const DataIntelligenceSection = ({ user }) => {
  // Integrated Sync Hook
  const { customers: rawCustomers, tasks: rawTasks, loading: syncLoading, refetch } = useCustomerTaskSync();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProcessing, setLoadingProcessing] = useState(true);

  // --- State ---
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('intelligence_view_mode') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [overrides, setOverrides] = useState({});
  
  // Dashboard Metrics & Forecast
  const [metrics, setMetrics] = useState({
      totalPipeline: 0,
      weightedForecast: 0,
      revenueAtRisk: 0,
      revenuePotential: 0
  });
  const [forecastData, setForecastData] = useState([]);
  
  // Advanced Filter State
  const [filterPathology, setFilterPathology] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterTemperature, setFilterTemperature] = useState('all');
  const [availablePathologies, setAvailablePathologies] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Product Associations
  const productAssociations = {
      'diabetes': 'Alcaline Max',
      'dor': 'Pulseira Magnética',
      'sono': 'Colchão Terapêutico',
      'energia': 'Combo Vitalidade',
      'stress': 'Pulseira Bioquântica',
      'coluna': 'Colchão Magnético'
  };

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('intelligence_columns_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'name', label: 'Nome', visible: true },
      { id: 'temperature', label: 'Temperatura', visible: true },
      { id: 'score', label: 'Score', visible: true },
      { id: 'next_action', label: 'Próxima Ação', visible: true },
      { id: 'ltv', label: 'LTV', visible: true },
      { id: 'potential', label: 'Potencial', visible: true },
      { id: 'last_contact', label: 'Último Contato', visible: true },
      { id: 'pathologies', label: 'Patologias', visible: false },
      { id: 'products', label: 'Produtos', visible: false },
    ];
  });

  useEffect(() => {
    const savedOverrides = JSON.parse(localStorage.getItem('copilot_overrides') || '{}');
    setOverrides(savedOverrides);
  }, []);

  useEffect(() => {
    localStorage.setItem('intelligence_columns_v2', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('intelligence_view_mode', viewMode);
  }, [viewMode]);

  // Derived Logic Functions
  const determineNextBestAction = (client, recs) => {
      if (client.temperature === 'At Risk') return 'Reativar Cliente VIP - Urgente';
      if (client.temperature === 'Hot' && client.products.length === 0) return 'Fechar Primeira Venda';
      if (client.objections.some(o => o.toLowerCase().includes('preço'))) return 'Apresentar Parcelamento/Desconto';
      if (recs.length > 0) return `Oferecer ${recs[0].productName}`;
      if (client.temperature === 'Warm') return 'Enviar Conteúdo de Valor';
      return 'Agendar Contato de Relacionamento';
  };

  const getRecommendations = (client) => {
      const recs = [];
      client.pathologies.forEach(path => {
          Object.keys(productAssociations).forEach(key => {
              if (path.toLowerCase().includes(key) && !client.products.some(p => p.includes(productAssociations[key]))) {
                  recs.push({
                      productName: productAssociations[key],
                      reason: `Para: ${path}`
                  });
              }
          });
      });
      if (client.products.some(p => p.toLowerCase().includes('alcaline')) && !client.products.some(p => p.toLowerCase().includes('refil'))) {
           recs.push({ productName: 'Refil Anual', reason: 'Manutenção Preventiva' });
      }
      return recs;
  };

  // Processing Effect
  useEffect(() => {
    const process = async () => {
        if (!user) return;
        setLoadingProcessing(true);
        try {
            // Needed: Activities and Products to enrich the customer data
            const [actRes, prodRes] = await Promise.all([
                supabase.from('sales_opportunities')
                    .select('*, opportunity_products(product:products(name))')
                    .eq('distributor_id', user.id),
                supabase.from('products').select('*').eq('distributor_id', user.id)
            ]);
            
            if (actRes.error) throw actRes.error;
            if (prodRes.error) throw prodRes.error;

            const activitiesData = actRes.data || [];
            setProducts(prodRes.data || []);

            // Task 1: Deduplication Logic
            // We use a Map to keep unique customers based on normalized name + phone (or just name if phone missing)
            // If ID matches, it's same record anyway. If ID differs but Name+Phone match, we treat as duplicate and keep first one found (or latest).
            // Here, we prioritize `rawCustomers` which comes from DB.
            const uniqueMap = new Map();
            rawCustomers.forEach(c => {
                if (!c.name) return;
                const normalizedName = c.name.trim().toLowerCase();
                const normalizedPhone = c.phone ? c.phone.replace(/\D/g, '') : 'no-phone';
                
                // Construct a key for uniqueness. 
                // Prioritize strict checking: Name + Phone must match if phone exists.
                // If phone doesn't exist, rely on Name.
                const key = `${normalizedName}|${normalizedPhone}`;
                
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, c);
                } else {
                    // Optional: Merge or pick 'better' record? 
                    // For now, simple deduplication: keep first found.
                    // If we wanted latest, we'd check created_at.
                }
            });
            const dedupedCustomers = Array.from(uniqueMap.values());

            const aggregatedClients = dedupedCustomers.map(cust => {
                const customerActivities = activitiesData.filter(
                    a => a.customer_id === cust.id || 
                         (a.customer_name && cust.name && a.customer_name.toLowerCase() === cust.name.toLowerCase())
                );
                
                // AI/System Calculations
                const systemPathologies = [...new Set(customerActivities.map(a => a.pathology).filter(Boolean).flatMap(p => p.split(',').map(s => s.trim())))];
                const objections = [...new Set(customerActivities.map(a => a.objections).filter(Boolean))];
                const products = [...new Set(customerActivities.filter(a => a.status === 'sale_made').flatMap(a => a.opportunity_products || []).map(op => op.product?.name).filter(Boolean))];
                const ltv = customerActivities.filter(a => a.status === 'sale_made').reduce((sum, a) => sum + (Number(a.sale_value) || 0), 0);
                
                const dates = customerActivities.map(a => new Date(a.visit_date).getTime());
                const lastContact = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

                const { score, temperature, potential, conversionProbability } = calculateClientIntelligence({ 
                    lastContactDate: lastContact, 
                    totalPurchases: products.length, 
                    ltv, 
                    totalVisits: customerActivities.length 
                });
                
                const tempClientForRecs = { pathologies: systemPathologies, products };
                const recommendations = getRecommendations(tempClientForRecs);
                const nextBestAction = determineNextBestAction({...tempClientForRecs, temperature, objections}, recommendations);

                const baseClient = {
                    ...cust,
                    ltv,
                    pathologies: systemPathologies,
                    objections,
                    products,
                    lastContact,
                    totalVisits: customerActivities.length,
                    leadScore: score,
                    temperature,
                    nextBestAction,
                    revenuePotential: potential,
                    conversionProbability,
                    _recommendations: recommendations,
                    isOverridden: false
                };

                // Apply Overrides if they exist
                if (overrides[cust.id]) {
                    return { 
                        ...baseClient, 
                        ...overrides[cust.id], 
                        isOverridden: true 
                    };
                }

                return baseClient;
            });

            // Metrics Logic
            const totalPipeline = aggregatedClients.reduce((sum, c) => sum + Number(c.revenuePotential || 0), 0);
            const revenueAtRisk = aggregatedClients.filter(c => c.temperature === 'At Risk').reduce((sum, c) => sum + Number(c.revenuePotential || 0), 0);
            
            const weightedForecast = aggregatedClients.reduce((sum, c) => {
                return sum + (Number(c.revenuePotential || 0) * (Number(c.conversionProbability || 0) / 100));
            }, 0);

            setMetrics({
                totalPipeline,
                revenueAtRisk,
                weightedForecast,
                revenuePotential: totalPipeline
            });
            
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
            const projectionData = months.map((m, i) => {
                const baseVal = weightedForecast / 3; 
                const trend = 1 + (i * 0.1); 
                return {
                    period: m,
                    value: Math.round(baseVal * trend)
                };
            });
            setForecastData(projectionData);

            const allPathologies = [...new Set(aggregatedClients.flatMap(c => c.pathologies))];
            const allProducts = [...new Set(aggregatedClients.flatMap(c => c.products))];
            setAvailablePathologies(allPathologies);
            setAvailableProducts(allProducts);

            const tempOrder = { 'Hot': 0, 'At Risk': 1, 'Warm': 2, 'Cold': 3 };
            aggregatedClients.sort((a,b) => tempOrder[a.temperature] - tempOrder[b.temperature]);

            setClients(aggregatedClients);
        } catch (err) {
            console.error("Processing error", err);
        } finally {
            setLoadingProcessing(false);
        }
    };
    process();
  }, [user, rawCustomers, rawTasks, overrides]);


  const handleSaveOverride = (clientId, newData) => {
    const newOverrides = { ...overrides, [clientId]: newData };
    setOverrides(newOverrides);
    localStorage.setItem('copilot_overrides', JSON.stringify(newOverrides));
    
    // Update local state immediately for responsiveness
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...newData, isOverridden: true } : c));
    toast({ title: "Alterações salvas", description: "As informações do cliente foram atualizadas localmente." });
    
    // Also update selectedClient if it matches
    if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => ({ ...prev, ...newData, isOverridden: true }));
    }
  };

  const handleResetOverride = (clientId) => {
    const newOverrides = { ...overrides };
    delete newOverrides[clientId];
    setOverrides(newOverrides);
    localStorage.setItem('copilot_overrides', JSON.stringify(newOverrides));
    toast({ title: "Resetado", description: "Valores originais do sistema restaurados." });
    
    // Trigger fetch to get original values back (will trigger effect)
    if (selectedClient) setSelectedClient(null); 
  };

  const filteredClients = useMemo(() => {
    let result = clients;
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.name.toLowerCase().includes(lowerTerm) || 
            c.pathologies.some(p => p.toLowerCase().includes(lowerTerm))
        );
    }
    if (filterPathology !== 'all') result = result.filter(c => c.pathologies.includes(filterPathology));
    if (filterProduct !== 'all') result = result.filter(c => c.products.includes(filterProduct));
    if (filterTemperature !== 'all') result = result.filter(c => c.temperature === filterTemperature);

    return result;
  }, [clients, searchTerm, filterPathology, filterProduct, filterTemperature]);

  const toggleColumn = (id) => setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  
  const handleExport = () => {
      const data = filteredClients.map(c => ({
          'Nome': c.name,
          'Temperatura': c.temperature,
          'Score': c.leadScore,
          'LTV': c.ltv,
          'Potencial': c.revenuePotential,
          'Último Contato': c.lastContact,
          'Próxima Ação': c.nextBestAction
      }));
      exportToExcel(data, 'Sales_Copilot_Report', 'Pipeline');
      toast({ title: "Exportado", description: "Relatório de pipeline gerado com sucesso." });
  };
  
  const handleActivityAdded = () => {
      // No need to manually fetch, sync hook will catch it
      setIsAddActivityOpen(false);
  };

  const isLoading = syncLoading || loadingProcessing;

  return (
    <div className="space-y-8 mb-8 animate-in fade-in duration-500 min-h-screen">
        <Helmet><title>Sales Copilot - METRIX</title></Helmet>

        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <BrainCircuit className="w-8 h-8 text-violet-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-violet-200">
                                Sales Copilot
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-300 bg-violet-500/5">AI Powered + User Control</Badge>
                                <p className="text-white/50 text-sm">Inteligência de Vendas e Oportunidades</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading} className="border-white/10 text-white hover:bg-white/10">
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2"/> Exportar
                    </Button>
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20" onClick={() => setIsAddActivityOpen(true)}>
                        <Plus className="w-4 h-4 mr-2"/> Nova Atividade
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CopilotStatCard 
                        title="Pipeline Total" 
                        value={formatCurrency(metrics.totalPipeline)} 
                        subtext="Potencial Bruto" 
                        icon={Wallet} 
                        colorClass="text-indigo-400"
                    />
                    <CopilotStatCard 
                        title="Previsão Ponderada" 
                        value={formatCurrency(metrics.weightedForecast)} 
                        subtext="Baseado na temperatura" 
                        icon={TrendingUp} 
                        trend={12}
                        colorClass="text-emerald-400"
                    />
                    <CopilotStatCard 
                        title="Receita em Risco" 
                        value={formatCurrency(metrics.revenueAtRisk)} 
                        subtext="Clientes frios de alto valor" 
                        icon={AlertTriangle} 
                        colorClass="text-rose-400"
                    />
                    <CopilotStatCard 
                        title="Oportunidades Quentes" 
                        value={clients.filter(c => c.temperature === 'Hot').length} 
                        subtext="Prontos para fechar" 
                        icon={Activity} 
                        colorClass="text-amber-400"
                    />
                </div>
                
                <div className="bg-[#161922]/80 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Projeção de Receita</h4>
                    <RevenueForecastChart data={forecastData} />
                </div>
            </div>
        </div>

        <div className="bg-[#161922] p-4 rounded-xl border border-white/5 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center shadow-lg shadow-black/20 sticky top-4 z-30">
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-1">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input 
                        placeholder="Buscar cliente, patologia..." 
                        className="pl-10 bg-[#0B0E14] border-white/10 text-white focus:border-violet-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`bg-[#0B0E14] border-white/10 text-white/70 hover:text-white ${filterTemperature !== 'all' ? 'border-violet-500 text-violet-400' : ''}`}>
                                <Filter className="w-4 h-4 mr-2" /> 
                                {filterTemperature === 'all' ? 'Temperatura' : filterTemperature}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 bg-[#161922] border-white/10 p-2">
                             {['all', 'Hot', 'Warm', 'Cold', 'At Risk'].map(t => (
                                 <div key={t} onClick={() => setFilterTemperature(t)} className="cursor-pointer p-2 hover:bg-white/5 rounded text-sm text-white capitalize flex items-center gap-2">
                                     {t === 'all' ? 'Todas' : t}
                                 </div>
                             ))}
                        </PopoverContent>
                    </Popover>
                    
                    <Select value={filterPathology} onValueChange={setFilterPathology}>
                        <SelectTrigger className="w-[140px] bg-[#0B0E14] border-white/10 text-white">
                            <SelectValue placeholder="Patologia" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161922] border-white/10 text-white">
                            <SelectItem value="all">Todas</SelectItem>
                            {availablePathologies.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    {(filterPathology !== 'all' || filterTemperature !== 'all') && (
                        <Button variant="ghost" size="icon" onClick={() => {setFilterPathology('all'); setFilterTemperature('all')}} className="text-white/40 hover:text-white">
                            <X className="w-4 h-4"/>
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                <div className="bg-[#0B0E14] rounded-lg p-1 flex border border-white/10">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white'}`} title="Grade">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white'}`} title="Tabela">
                        <ListIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white'}`} title="Kanban">
                        <Kanban className="w-4 h-4" />
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
            {isLoading && clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/40">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-violet-500" />
                    <p className="text-sm font-medium">Carregando inteligência de vendas...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/30 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <Search className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                    <p className="text-sm">Ajuste os filtros para encontrar oportunidades.</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewMode === 'grid' ? (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {filteredClients.map(client => (
                                <ClientCard key={client.id} client={client} onClick={setSelectedClient} />
                            ))}
                        </motion.div>
                    ) : viewMode === 'kanban' ? (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <CopilotKanbanBoard clients={filteredClients} onCardClick={setSelectedClient} />
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
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map(client => (
                                        <ClientTableRow 
                                            key={client.id} 
                                            client={client} 
                                            columns={columns} 
                                            onClick={setSelectedClient} 
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>

        <ClientDetailModal 
            client={selectedClient} 
            isOpen={!!selectedClient} 
            onClose={() => setSelectedClient(null)} 
            recommendations={selectedClient?._recommendations || []}
            onSave={handleSaveOverride}
            onReset={handleResetOverride}
        />
        
        {isAddActivityOpen && (
            <AddSalesActivityModal
                isOpen={isAddActivityOpen}
                onClose={() => setIsAddActivityOpen(false)}
                user={user}
                onActivityAdded={handleActivityAdded}
                customers={rawCustomers} 
                products={products}
            />
        )}
    </div>
  );
};

export default DataIntelligenceSection;