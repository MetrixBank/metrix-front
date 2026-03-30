import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, Loader2, ArrowDown, ArrowUp, PackagePlus } from 'lucide-react';
import AddProductModal from '@/components/AddProductModal';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/contexts/DataSyncContext';
import TeamStockSummary from '../overview/TeamStockSummary';
import DistributorStockList from '../overview/DistributorStockList';
import OpportunityFilters from '../overview/OpportunityFilters';

const ProductTotalStockCard = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <motion.div 
        layout
        className="p-3 border rounded-lg bg-background/50 text-sm shadow-md hover:border-primary/50 transition-all duration-300"
      >
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex-grow">
                <p className="font-bold text-base text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-lg text-primary">{product.totalQuantity}</p>
                </div>
                {isOpen ? <ArrowUp className="w-4 h-4 text-muted-foreground" /> : <ArrowDown className="w-4 h-4 text-muted-foreground" />}
            </div>
        </div>
        <AnimatePresence>
            {isOpen && (
                 <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden"
                >
                    <div className="border-t border-border/30 pt-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold mb-2 px-2">
                            <span>Distribuidor</span>
                            <span className="text-right">Quantidade</span>
                        </div>
                        <div className="space-y-1">
                            {product.distributors.sort((a, b) => b.quantity - a.quantity).map(dist => (
                                <div key={dist.id} className="grid grid-cols-2 gap-x-4 text-sm px-2 py-1 rounded hover:bg-muted/30">
                                    <span className="truncate" title={dist.name}>{dist.name}</span>
                                    <span className="text-right">{dist.quantity} un.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    );
};


const AdminStockTab = () => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [allDistributors, setAllDistributors] = useState([]);
  const [distributorHierarchy, setDistributorHierarchy] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { syncKey } = useDataSync();
  const [filters, setFilters] = useState({
    distributorId: 'all',
    customerSearch: '', // used for product search
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const { data: distributorsData, error: distributorsError } = await supabase
            .from('profiles')
            .select('id, name, parent_id')
            .in('role', ['distributor', 'sub-admin', 'master-admin']);
        if (distributorsError) throw distributorsError;
        setAllDistributors(distributorsData || []);

        const hierarchy = {};
        (distributorsData || []).forEach(d => {
            if (!hierarchy[d.id]) hierarchy[d.id] = [];
            let p = d.parent_id;
            while (p) {
                if (!hierarchy[p]) hierarchy[p] = [];
                hierarchy[p].push(d.id);
                const parentUser = distributorsData.find(u => u.id === p);
                p = parentUser ? parentUser.parent_id : null;
            }
        });
        setDistributorHierarchy(hierarchy);

        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`*, distributor:profiles!inner(id, name, distributor_type)`)
            .order('name', { ascending: true });
        if (productsError) throw productsError;

        setAllProducts(productsData || []);

    } catch (err) {
      setError(err.message);
      toast({ title: "Erro ao buscar dados de estoque", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, syncKey]);

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];
    if (filters.distributorId !== 'all') {
        const descendantIds = new Set(distributorHierarchy[filters.distributorId] || []);
        descendantIds.add(filters.distributorId);
        products = products.filter(p => p.distributor && descendantIds.has(p.distributor.id));
    }
    if (filters.customerSearch) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(filters.customerSearch.toLowerCase()) || 
            (p.sku && p.sku.toLowerCase().includes(filters.customerSearch.toLowerCase()))
        );
    }
    return products;
  }, [allProducts, filters, distributorHierarchy]);

  const totalStockByProduct = useMemo(() => {
    const productMap = new Map();
    filteredProducts.forEach(p => {
        if (!productMap.has(p.name)) {
            productMap.set(p.name, { name: p.name, sku: p.sku, totalQuantity: 0, distributors: [] });
        }
        const productInfo = productMap.get(p.name);
        productInfo.totalQuantity += p.quantity_in_stock;
        productInfo.distributors.push({ id: p.distributor.id, name: p.distributor.name, quantity: p.quantity_in_stock });
    });
    return Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredProducts]);

  const distributorsWithStock = useMemo(() => {
    const distributorIdsWithStock = new Set(filteredProducts.map(p => p.distributor.id));
    return allDistributors.filter(d => distributorIdsWithStock.has(d.id));
  }, [filteredProducts, allDistributors]);


  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  const summaryTitle = `Resumo do Estoque`;

  return (
    <div className="space-y-6">
      <OpportunityFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        distributors={allDistributors}
        fetchData={fetchData}
        loading={loading}
        showCustomerSearch={true}
        customerSearchLabel="Produto/SKU"
        customerSearchPlaceholder="Buscar produto..."
      />

      <Card className="card-gradient backdrop-blur-sm shadow-xl border-border/30 overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="flex items-center text-xl sm:text-2xl text-gradient">
              <Package className="w-6 h-6 mr-2.5" />
              Gestão de Estoque Total
            </CardTitle>
            <Button onClick={() => handleOpenModal()} size="sm" className="text-xs sm:text-sm px-3 py-1.5 self-end sm:self-center bg-primary/80 hover:bg-primary">
              <PackagePlus className="w-4 h-4 mr-2" /> Adicionar Item
            </Button>
          </div>
          
        </CardHeader>
        <CardContent className="p-0 sm:p-2 md:p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              <p>Ocorreu um erro ao carregar o estoque.</p>
              <Button onClick={fetchData} className="mt-4">Tentar Novamente</Button>
            </div>
          ) : (
            <>
              <div className="p-4">
                <TeamStockSummary products={filteredProducts} distributors={distributorsWithStock} title={summaryTitle} />
              </div>

              <div className="p-4 mt-6">
                 <h3 className="text-lg font-semibold my-4 text-gradient">Análise de Estoque por Distribuidor</h3>
                 <DistributorStockList products={filteredProducts} distributors={distributorsWithStock} />
              </div>

               <div className="px-4">
                <h3 className="text-lg font-semibold my-4 text-gradient">Estoque Total por Produto</h3>
              </div>
              <AnimatePresence>
                {totalStockByProduct.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center text-muted-foreground text-sm p-6"
                  >
                    Nenhum item encontrado para os filtros selecionados.
                  </motion.p>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 mt-1 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar p-3 sm:p-2"
                  >
                    {totalStockByProduct.map(prod => (
                      <motion.div key={prod.name} variants={itemVariants}>
                          <ProductTotalStockCard product={prod} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
      {isModalOpen && user && (
        <AddProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productData={editingProduct}
          user={user}
        />
      )}
    </div>
  );
};

export default AdminStockTab;