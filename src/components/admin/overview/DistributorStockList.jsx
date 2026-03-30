import React, { useMemo, useState } from 'react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Package, User, Search, TrendingDown, TrendingUp } from 'lucide-react';
    import { formatCurrency } from '@/lib/utils';
    import { Input } from '@/components/ui/input';
    import { motion, AnimatePresence } from 'framer-motion';

    const DistributorStockList = ({ products, distributors }) => {
        const [searchTerm, setSearchTerm] = useState('');

        const distributorStock = useMemo(() => {
            if (!products || !distributors) return [];

            const stockByDistributor = new Map();
            distributors.forEach(dist => {
                stockByDistributor.set(dist.id, {
                    ...dist,
                    products: [],
                    totalStockCost: 0,
                    totalStockRevenue: 0,
                    totalUnits: 0,
                });
            });

            products.forEach(prod => {
                if (prod.distributor_id && stockByDistributor.has(prod.distributor_id)) {
                    const distData = stockByDistributor.get(prod.distributor_id);
                    distData.products.push(prod);
                    distData.totalStockCost += (prod.cost_price || 0) * (prod.quantity_in_stock || 0);
                    distData.totalStockRevenue += (prod.sale_price || 0) * (prod.quantity_in_stock || 0);
                    distData.totalUnits += prod.quantity_in_stock || 0;
                }
            });

            return Array.from(stockByDistributor.values()).filter(d => d.products.length > 0);
        }, [products, distributors]);

        const filteredDistributors = useMemo(() => {
            if (!searchTerm) return distributorStock;
            const term = searchTerm.toLowerCase();
            return distributorStock.filter(dist => 
                dist.name.toLowerCase().includes(term) ||
                dist.products.some(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
            );
        }, [distributorStock, searchTerm]);

        return (
            <Card className="card-gradient shadow-xl">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-lg sm:text-xl text-gradient flex items-center">
                            <User className="w-6 h-6 mr-2 text-primary" />
                            Estoque Detalhado por Distribuidor
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar distribuidor ou produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        <AnimatePresence>
                            {filteredDistributors.length > 0 ? (
                                filteredDistributors.map((dist, index) => (
                                    <motion.div
                                        key={dist.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <DistributorCard distributor={dist} />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-8"
                                >
                                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const DistributorCard = ({ distributor }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="bg-background/40 p-4 rounded-lg border border-border/30">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <div>
                        <p className="font-semibold text-primary">{distributor.name}</p>
                        <p className="text-sm text-muted-foreground">{distributor.products.length} tipos de produtos | {distributor.totalUnits} un. totais</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-sm flex items-center justify-end gap-1 text-green-400">
                          <TrendingDown className="w-4 h-4"/> {formatCurrency(distributor.totalStockCost)}
                        </p>
                        <p className="font-semibold text-sm flex items-center justify-end gap-1 text-blue-400">
                           <TrendingUp className="w-4 h-4"/> {formatCurrency(distributor.totalStockRevenue)}
                        </p>
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
                                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm font-semibold mb-2 px-2">
                                    <span>Produto</span>
                                    <span className="text-right">Quantidade</span>
                                    <span className="text-right">Valor (Custo)</span>
                                </div>
                                <div className="space-y-1">
                                    {distributor.products.sort((a, b) => b.quantity_in_stock - a.quantity_in_stock).map(prod => (
                                        <div key={prod.id} className="grid grid-cols-3 gap-x-4 text-sm px-2 py-1 rounded hover:bg-muted/30">
                                            <span className="truncate" title={prod.name}>{prod.name}</span>
                                            <span className="text-right">{prod.quantity_in_stock} un.</span>
                                            <span className="text-right">{formatCurrency(prod.cost_price * prod.quantity_in_stock)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    export default DistributorStockList;