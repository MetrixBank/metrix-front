import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { 
  Package, PackagePlus, Edit, Trash2, Search, AlertTriangle, 
  Loader2, TrendingUp, DollarSign, Activity, Users, 
  Sparkles, LayoutGrid, List as ListIcon,
  Target, Zap, TrendingDown,
  Megaphone, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// UI Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import AddProductModal from '@/components/AddProductModal';
import TutorialStep from '@/components/tutorial/TutorialStep';

// --- Configuration & Constants ---
const PRODUCT_PATHOLOGY_MAP = {
  'alcaline': ['Acidose', 'Refluxo', 'Gastrite', 'Diabetes'],
  'magnet': ['Dores Articulares', 'Circulação', 'Inflamação', 'Fibromialgia'],
  'infra': ['Inflamação Crônica', 'Recuperação Muscular', 'Artrite'],
  'sono': ['Insônia', 'Cansaço Crônico', 'Apneia'],
  'energy': ['Fadiga', 'Baixa Imunidade', 'Estresse'],
  'pulseira': ['Equilíbrio', 'Ansiedade', 'Labirintite'],
  'colchão': ['Hérnia de Disco', 'Bico de Papagaio', 'Artrose', 'Lombalgia'],
  'palmilha': ['Fascite Plantar', 'Esporão', 'Má Circulação']
};

const BUNDLE_OPPORTUNITIES = {
  'colchão': ['Travesseiro Magnético', 'Protetor Impermeável'],
  'alcaline': ['Garrafa Portátil', 'Refil Extra'],
  'pulseira': ['Palmilha Magnética']
};

const getHealthStatusColor = (status) => {
  switch (status) {
    case 'healthy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
    case 'alert': return 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]';
    case 'stalled': return 'text-rose-400 bg-rose-400/10 border-rose-400/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

const StockManagementTab = ({ user: propUser }) => {
  // Use context user if prop user is not available (ensures robustness)
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;

  const { syncKey, triggerSync } = useDataSync();
  const { isTutorialActive, nextStep, currentStep } = useTutorial();
  
  // State
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, healthy, alert, stalled
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Products
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('distributor_id', user.id)
        .order('name');
      if (prodError) throw prodError;

      // 2. Fetch Sales History (for turnover) - Last 180 days for better trend analysis
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      
      const { data: salesHistory, error: salesError } = await supabase
        .from('opportunity_products')
        .select(`
          product_id,
          quantity_sold,
          created_at,
          sales_opportunities!inner(status, customer_name, customer_id, visit_date, pathology)
        `)
        .eq('sales_opportunities.distributor_id', user.id)
        .eq('sales_opportunities.status', 'sale_made')
        .gte('created_at', sixMonthsAgo.toISOString());
        
      if (salesError) throw salesError;

      // 3. Fetch Customers & Intelligence
      const { data: customerData, error: custError } = await supabase
        .from('customers')
        .select(`
            id, name, phone, last_activity_date,
            customer_intelligence(lead_score, status, purchase_probability)
        `)
        .eq('distributor_id', user.id);
        
      if (custError) throw custError;

      setProducts(productsData || []);
      setSalesData(salesHistory || []);
      setCustomers(customerData || []);
      
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast({ title: "Erro", description: "Falha ao carregar dados do estoque.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, syncKey]);

  // --- Advanced Intelligence Processing ---
  const processedInventory = useMemo(() => {
    // Mock categories based on keywords for demo
    const categorize = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('colchão')) return 'Colchões';
        if (lower.includes('alcaline') || lower.includes('água')) return 'Purificadores';
        if (lower.includes('pulseira')) return 'Acessórios';
        return 'Outros';
    };

    return products.map(product => {
      // 1. Sales Metrics (90 days window for turnover)
      const now = new Date();
      const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
      
      const recentSales = salesData.filter(s => 
          s.product_id === product.id && 
          new Date(s.created_at) >= ninetyDaysAgo
      );

      const allSalesForProduct = salesData.filter(s => s.product_id === product.id);
      const totalUnitsSold = allSalesForProduct.reduce((sum, s) => sum + (s.quantity_sold || 0), 0);
      const totalUnitsSold90d = recentSales.reduce((sum, s) => sum + (s.quantity_sold || 0), 0);
      
      // Turnover Rate = (Units Sold / Average Inventory) * 100
      // Simplified: Units Sold / (Current Stock + Units Sold/2)
      const avgInventory = product.quantity_in_stock + (totalUnitsSold90d / 2);
      const turnoverRate = avgInventory > 0 ? (totalUnitsSold90d / avgInventory) : 0;
      
      // Days in Inventory (Approximate)
      // If we sell X units in 90 days, we sell X/90 per day.
      // Stock / (Units per Day) = Days of Inventory Left
      const unitsPerDay = totalUnitsSold90d / 90;
      const daysInventoryLeft = unitsPerDay > 0 ? (product.quantity_in_stock / unitsPerDay) : 999;

      // 2. Health Status Algorithm
      let status = 'healthy';
      let riskFactors = [];
      let actions = [];

      if (product.quantity_in_stock === 0) {
          status = 'alert';
          riskFactors.push('Estoque zerado - Perda de vendas');
          actions.push('Repor Estoque');
      } else if (daysInventoryLeft > 180 && product.quantity_in_stock > 5) {
          status = 'stalled';
          riskFactors.push('Estagnado (> 6 meses de estoque)');
          actions.push('Criar Promoção', 'Marcar para Queima');
      } else if (daysInventoryLeft < 15) {
          status = 'healthy'; // High demand, but needs attention
          riskFactors.push('Estoque crítico (< 15 dias)');
          actions.push('Compra Urgente');
      } else if (turnoverRate < 0.2 && product.quantity_in_stock > 10) {
          status = 'alert';
          riskFactors.push('Baixo Giro');
          actions.push('Ofertar para Clientes Antigos');
      } else {
          status = 'healthy';
          actions.push('Manter Estoque');
      }

      // 3. Financial Impact
      const investedValue = (product.cost_price || 0) * (product.quantity_in_stock || 0);
      const potentialRevenue = (product.sale_price || 0) * (product.quantity_in_stock || 0);
      const revenueAtRisk = status === 'stalled' ? potentialRevenue : 0;

      // 4. Intelligent Matching
      // Identify target pathologies for this product
      const keywords = Object.keys(PRODUCT_PATHOLOGY_MAP).find(k => product.name.toLowerCase().includes(k));
      const targetPathologies = keywords ? PRODUCT_PATHOLOGY_MAP[keywords] : ['Geral'];
      
      // Find matching customers (Mock matching logic based on customer name/random for demo structure)
      // Real implementation would look at `sales_opportunities` pathologies or customer profile tags
      const matchedCustomers = customers.filter(c => {
          // Mock: Randomly assign affinity based on ID hash or similar to simulate AI match
          const affinity = (c.name.length + product.name.length) % 3 === 0;
          return affinity; 
      }).slice(0, 5); // Top 5 matches

      // 5. Bundle Opportunities
      const bundleKeyword = Object.keys(BUNDLE_OPPORTUNITIES).find(k => product.name.toLowerCase().includes(k));
      const suggestedBundles = bundleKeyword ? BUNDLE_OPPORTUNITIES[bundleKeyword] : [];

      return {
        ...product,
        category: categorize(product.name),
        metrics: {
          turnoverRate,
          daysInventoryLeft,
          totalUnitsSold,
          status,
          riskFactors,
          recommendedActions: actions,
          investedValue,
          potentialRevenue,
          revenueAtRisk,
          targetPathologies,
          matchedCustomers,
          suggestedBundles
        }
      };
    });
  }, [products, salesData, customers]);

  const filteredInventory = useMemo(() => {
    return processedInventory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || p.metrics.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [processedInventory, searchTerm, statusFilter]);

  // --- Dashboard Summary Metrics ---
  const dashboardStats = useMemo(() => {
    const totalInvested = processedInventory.reduce((sum, p) => sum + p.metrics.investedValue, 0);
    const totalRevenue = processedInventory.reduce((sum, p) => sum + p.metrics.potentialRevenue, 0);
    const totalAtRisk = processedInventory.reduce((sum, p) => sum + p.metrics.revenueAtRisk, 0);
    
    const actionNeededCount = processedInventory.filter(p => p.metrics.status !== 'healthy').length;
    const topOpportunity = processedInventory
        .filter(p => p.metrics.status === 'healthy')
        .sort((a,b) => b.metrics.potentialRevenue - a.metrics.potentialRevenue)[0];

    return { totalInvested, totalRevenue, totalAtRisk, actionNeededCount, topOpportunity };
  }, [processedInventory]);

  // --- Handlers ---
  const handleOpenAddModal = (product = null) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
    if (isTutorialActive && currentStep === 6) nextStep();
  };

  const handleDeleteRequest = (product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
      if (error) throw error;
      toast({ title: "Produto excluído", description: "Item removido do inventário." });
      triggerSync();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteOpen(false);
      setProductToDelete(null);
    }
  };

  const openOfferModal = (product) => {
    setSelectedOfferProduct(product);
    setIsOfferModalOpen(true);
  };

  const handleQuickAction = (action, product) => {
      if (action === 'Offer to Customers') openOfferModal(product);
      else {
          toast({ title: "Ação Iniciada", description: `Iniciando: ${action} para ${product.name}` });
      }
  };

  // --- Renderers ---
  const renderStatusBadge = (status) => {
    const labels = { healthy: 'Saudável', alert: 'Atenção', stalled: 'Estagnado' };
    const icons = { healthy: TrendingUp, alert: AlertTriangle, stalled: TrendingDown };
    const Icon = icons[status];
    
    return (
      <Badge variant="outline" className={`${getHealthStatusColor(status)} capitalize flex items-center gap-1.5 px-2 py-0.5`}>
        <Icon className="w-3 h-3" />
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    // Uses a simpler local loader, avoiding full page fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-muted-foreground text-sm">Carregando seu estoque...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      
      {/* 1. Header & AI Summary */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Package className="w-8 h-8 text-violet-500" />
              Gestão Inteligente de Estoque
            </h1>
            <p className="text-slate-400 mt-1">Análise preditiva e saúde financeira do seu inventário.</p>
          </div>
          <div className="flex gap-2">
              <TutorialStep step={6} content="Adicione produtos ao seu arsenal aqui.">
                <Button onClick={() => handleOpenAddModal()} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20">
                  <PackagePlus className="mr-2 h-4 w-4" /> Novo Produto
                </Button>
              </TutorialStep>
          </div>
        </div>

        {/* AI Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard 
                title="Capital em Risco" 
                value={formatCurrency(dashboardStats.totalAtRisk)} 
                icon={AlertTriangle} 
                status="danger"
                description="Produtos estagnados ou obsoletos"
            />
            <SummaryCard 
                title="Ação Necessária" 
                value={`${dashboardStats.actionNeededCount} Itens`} 
                icon={Activity} 
                status="warning"
                description="Requerem atenção imediata"
            />
            <SummaryCard 
                title="Potencial de Receita" 
                value={formatCurrency(dashboardStats.totalRevenue)} 
                icon={DollarSign} 
                status="success"
                description="Valor total de venda projetado"
            />
            {dashboardStats.topOpportunity && (
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-900/20 border border-violet-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles className="w-12 h-12 text-white" /></div>
                    <div>
                        <p className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-1">Top Oportunidade</p>
                        <h3 className="text-lg font-bold text-white truncate" title={dashboardStats.topOpportunity.name}>
                            {dashboardStats.topOpportunity.name}
                        </h3>
                        <p className="text-xs text-violet-200/70 mt-1">Alta demanda e margem saudável</p>
                    </div>
                    <Button size="sm" variant="secondary" className="mt-3 w-full bg-violet-500 hover:bg-violet-600 text-white border-0 text-xs h-7" onClick={() => openOfferModal(dashboardStats.topOpportunity)}>
                        <Zap className="w-3 h-3 mr-1.5" /> Ofertar Agora
                    </Button>
                </div>
            )}
        </div>
      </div>

      {/* 2. Controls & Filters */}
      <Card className="bg-[#161922] border-white/5 shadow-2xl">
        <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-white/5">
          <div className="flex flex-1 w-full gap-4 items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Buscar produto, SKU, categoria..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0E14] border-white/10 text-slate-200 focus:border-violet-500/50"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              {[
                  { id: 'all', label: 'Todos' },
                  { id: 'healthy', label: 'Saudáveis' },
                  { id: 'alert', label: 'Atenção' },
                  { id: 'stalled', label: 'Estagnados' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
                    statusFilter === filter.id 
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' 
                      : 'bg-[#0B0E14] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center bg-[#0B0E14] rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Visualização em Lista Financeira"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Inventory Content */}
        <div className="p-4 min-h-[400px] bg-[#0B0E14]/50">
          {filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-white/5 rounded-xl bg-[#161922]">
              <Package className="w-12 h-12 mb-3 opacity-20" />
              <p>Nenhum produto encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {filteredInventory.map(product => (
                    <SmartProductCard 
                      key={product.id} 
                      product={product} 
                      onEdit={() => handleOpenAddModal(product)}
                      onDelete={() => handleDeleteRequest(product)}
                      onAction={handleQuickAction}
                      statusBadge={renderStatusBadge}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-lg border border-white/10 overflow-hidden bg-[#161922]"
                >
                  <InventoryTable 
                    products={filteredInventory}
                    onEdit={handleOpenAddModal}
                    onDelete={handleDeleteRequest}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Modals */}
      <AddProductModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        productData={editingProduct}
        user={user}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-[#161922] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400">Remover Produto</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja remover <strong>{productToDelete?.name}</strong>? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir Permanentemente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SmartOfferModal 
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        product={selectedOfferProduct}
      />
    </div>
  );
};

// --- Sub Components ---

const SummaryCard = ({ title, value, icon: Icon, status, description }) => {
    const colors = {
        success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
        warning: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
        danger: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
        neutral: 'text-blue-400 border-blue-500/20 bg-blue-500/10'
    };
    const colorClass = colors[status] || colors.neutral;

    return (
        <div className={`rounded-xl p-4 border flex flex-col justify-between shadow-lg backdrop-blur-sm bg-[#161922]/80 ${colorClass}`}>
            <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <Icon className={`w-5 h-5 opacity-80 ${colorClass.split(' ')[0]}`} />
            </div>
            <div>
                <h3 className={`text-2xl font-bold ${colorClass.split(' ')[0]}`}>{value}</h3>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
        </div>
    );
};

const SmartProductCard = ({ product, onEdit, onDelete, onAction, statusBadge }) => {
  const { metrics } = product;
  const healthPercent = metrics.daysInventoryLeft > 365 ? 10 : Math.min(100, Math.max(0, 100 - (metrics.daysInventoryLeft / 180 * 100)));

  return (
    <div className="bg-[#161922] border border-white/5 rounded-xl p-0 flex flex-col hover:border-violet-500/30 transition-all duration-300 shadow-lg group overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-white/5 bg-[#1A1D26]">
          <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {statusBadge(metrics.status)}
                    {metrics.suggestedBundles.length > 0 && (
                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] px-1.5 py-0.5">
                            <Sparkles className="w-3 h-3 mr-1" /> Bundle
                        </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-white truncate text-base" title={product.name}>{product.name}</h3>
              </div>
              
              <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onEdit}><Edit className="w-3.5 h-3.5" /></Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-400" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
          </div>
          <div className="flex justify-between items-end text-xs text-slate-500">
              <span>SKU: {product.sku || 'N/A'}</span>
              <span className="font-mono">{product.quantity_in_stock} un.</span>
          </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#161922] p-3">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Em Estoque</span>
          <span className="font-mono font-medium text-white">
            {product.quantity_in_stock}
          </span>
        </div>
        <div className="bg-[#161922] p-3">
           <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Vendidos</span>
           <span className="font-mono font-medium text-white">
             {metrics.totalUnitsSold}
           </span>
        </div>
        <div className="bg-[#161922] p-3">
           <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Investido</span>
           <span className="font-mono font-medium text-blue-300">{formatNumberWithSuffix(metrics.investedValue)}</span>
        </div>
        <div className="bg-[#161922] p-3">
           <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Potencial</span>
           <span className="font-mono font-medium text-emerald-300">{formatNumberWithSuffix(metrics.potentialRevenue)}</span>
        </div>
      </div>

      {/* Risk & Action Section */}
      <div className="p-4 flex-1 flex flex-col gap-3">
         {metrics.riskFactors.length > 0 && (
             <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/5 p-2 rounded border border-rose-500/10">
                 <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                 <div>
                     <span className="font-semibold block">Risco Detectado:</span>
                     {metrics.riskFactors[0]}
                 </div>
             </div>
         )}
         
         <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400">Match c/ Clientes</span>
                 <span className="text-violet-300 font-medium">{metrics.matchedCustomers.length} encontrados</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                 <Button onClick={() => onAction('Offer to Customers', product)} className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 border-0">
                     <Users className="w-3 h-3 mr-1.5" /> Ofertar
                 </Button>
                 {metrics.status === 'stalled' ? (
                      <Button onClick={() => onAction('Mark for Clearance', product)} variant="outline" className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                          <Tag className="w-3 h-3 mr-1.5" /> Queima
                      </Button>
                 ) : (
                      <Button onClick={() => onAction('Create Campaign', product)} variant="outline" className="h-8 text-xs border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
                          <Megaphone className="w-3 h-3 mr-1.5" /> Campanha
                      </Button>
                 )}
            </div>
         </div>
      </div>

      {/* Health Bar */}
      <div className="h-1 bg-[#0B0E14]">
        <div 
          className={`h-full transition-all duration-500 ${metrics.status === 'healthy' ? 'bg-emerald-500' : metrics.status === 'alert' ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${healthPercent}%` }} 
        />
      </div>
    </div>
  );
};

const InventoryTable = ({ products, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader className="bg-[#0B0E14]">
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="text-slate-400">Produto / SKU</TableHead>
          <TableHead className="text-slate-400 text-center">Saúde</TableHead>
          <TableHead className="text-slate-400 text-right">Em Estoque</TableHead>
          <TableHead className="text-slate-400 text-right">Vendidos</TableHead>
          <TableHead className="text-slate-400 text-right">Investido</TableHead>
          <TableHead className="text-slate-400 text-right">Potencial</TableHead>
          <TableHead className="text-right w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="border-white/5 hover:bg-white/5 text-sm">
            <TableCell className="font-medium text-white">
              <div className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-[10px] text-slate-500">{product.sku}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">
               <div className={`inline-flex items-center justify-center w-20 py-0.5 rounded text-[10px] font-bold uppercase ${
                   product.metrics.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                   product.metrics.status === 'alert' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                   'bg-rose-500/10 text-rose-400 border border-rose-500/20'
               }`}>
                   {product.metrics.status === 'stalled' ? 'Estagnado' : product.metrics.status === 'alert' ? 'Atenção' : 'Saudável'}
               </div>
            </TableCell>
            <TableCell className="text-right text-slate-300 font-mono">{product.quantity_in_stock}</TableCell>
            <TableCell className="text-right text-slate-300 font-mono">{product.metrics.totalUnitsSold}</TableCell>
            <TableCell className="text-right font-medium text-blue-300">{formatCurrency(product.metrics.investedValue)}</TableCell>
            <TableCell className="text-right font-medium text-emerald-300">{formatCurrency(product.metrics.potentialRevenue)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white" onClick={() => onEdit(product)}><Edit className="w-3 h-3"/></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-rose-400" onClick={() => onDelete(product)}><Trash2 className="w-3 h-3"/></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const SmartOfferModal = ({ isOpen, onClose, product }) => {
  if (!product) return null;
  const { metrics } = product;

  const copyOffer = (customerName, pathology) => {
    let text = `Olá ${customerName}! 👋\n\nNotei que você tem interesse em soluções para ${pathology || 'sua saúde'}.\n\nTenho uma condição especial para o *${product.name}*, que é ideal para esse caso.\n\n`;
    if (metrics.suggestedBundles.length > 0) {
        text += `💡 *Dica:* Ele funciona ainda melhor com: ${metrics.suggestedBundles.join(' + ')}.\n\n`;
    }
    text += `Podemos agendar uma entrega?`;
    
    navigator.clipboard.writeText(text);
    toast({ title: "Script Copiado!", description: "Cole no WhatsApp do cliente." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#161922] border-white/10 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-300">
            <Sparkles className="w-5 h-5" />
            Oportunidades de Venda: {product.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Abaixo estão os clientes com maior probabilidade de compra baseada em perfil e histórico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Insights */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 text-sm text-violet-200 flex gap-3">
             <Target className="w-5 h-5 mt-0.5 shrink-0 text-violet-400" />
             <div className="space-y-1">
                 <p className="font-semibold">Por que ofertar?</p>
                 <p className="text-xs text-slate-300 leading-relaxed">
                     Este produto resolve problemas como: <span className="text-white">{metrics.targetPathologies.join(', ')}</span>.
                 </p>
                 {metrics.suggestedBundles.length > 0 && (
                     <p className="text-xs text-emerald-300 mt-1">
                         <span className="font-bold">Cross-sell:</span> Ofereça junto com {metrics.suggestedBundles.join(', ')}.
                     </p>
                 )}
             </div>
          </div>

          <Separator className="bg-white/10" />
          
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Clientes Compatíveis ({metrics.matchedCustomers.length})</h4>

          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-3">
              {metrics.matchedCustomers.length > 0 ? metrics.matchedCustomers.map((customer, idx) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-violet-500/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-slate-700 border border-white/10">
                      <AvatarFallback className="text-xs bg-slate-800 text-slate-300">{customer.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{customer.name}</p>
                          {idx === 0 && <Badge className="text-[9px] h-4 px-1 bg-amber-500/20 text-amber-300 border-0">Top Match</Badge>}
                      </div>
                      <p className="text-[10px] text-slate-500">
                          {customer.phone || 'Sem telefone'} • Score: {customer.customer_intelligence?.lead_score || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => copyOffer(customer.name, metrics.targetPathologies[0])}>
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
              )) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                      Nenhum cliente compatível encontrado automaticamente.
                  </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockManagementTab;