import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useLocalization } from '@/contexts/LocalizationContext';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, colorClass, isMobile }) => (
    <div className="bg-secondary/30 p-2 sm:p-3 rounded-lg flex flex-col justify-between">
        <div className="flex items-center text-muted-foreground">
            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 mr-1.5 ${colorClass}`} />
            <span className="text-2xs sm:text-xs">{title}</span>
        </div>
        <p className={`text-sm sm:text-lg font-bold truncate ${colorClass}`}>{value}</p>
    </div>
);

const ProductListItem = ({ product, type, isMobile }) => (
    <motion.li 
        className="flex justify-between items-center text-2xs sm:text-xs py-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
    >
        <span className="truncate max-w-[60%] sm:max-w-[70%]">{product.name}</span>
        {type === 'top' && <span className="font-medium text-primary">{product.quantity_in_stock} un.</span>}
        {type === 'low' && <span className="font-medium text-destructive">{product.quantity_in_stock} un. (Mín: {product.low_stock_threshold})</span>}
    </motion.li>
);

const StockSummary = ({ products, isMobile }) => {
    const { formatMoney } = useLocalization();
    
    const totalStockValue = useMemo(() => {
        return (products || []).reduce((sum, product) => sum + (product.cost_price * product.quantity_in_stock), 0);
    }, [products]);
      
    const potentialSaleValueStock = useMemo(() => {
        return (products || []).reduce((sum, product) => sum + (product.sale_price * product.quantity_in_stock), 0);
    }, [products]);

    const top3ProductsByVolume = useMemo(() => {
        return (products || [])
            .sort((a, b) => b.quantity_in_stock - a.quantity_in_stock)
            .slice(0, 3);
    }, [products]);
      
    const lowStockProducts = useMemo(() => {
        return (products || []).filter(p => p.quantity_in_stock <= p.low_stock_threshold).slice(0,5);
    }, [products]);

    return (
        <Card className="card-gradient backdrop-blur-sm shadow-md h-full">
            <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base flex items-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary"/>
                    Resumo do Estoque
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <StatCard title="Valor Total (Custo)" value={formatMoney(totalStockValue)} icon={TrendingDown} colorClass="text-destructive" isMobile={isMobile} />
                    <StatCard title="Potencial (Venda)" value={formatMoney(potentialSaleValueStock)} icon={TrendingUp} colorClass="text-green-400" isMobile={isMobile} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold mb-1 text-foreground">Top 3 Produtos em Volume</h3>
                        {top3ProductsByVolume.length > 0 ? (
                            <ul className="divide-y divide-border/30">
                                {top3ProductsByVolume.map(p => <ProductListItem key={p.id} product={p} type="top" isMobile={isMobile} />)}
                            </ul>
                        ) : <p className="text-muted-foreground text-xs">Sem produtos em estoque.</p>}
                    </div>
                     <div>
                        <h3 className="text-xs sm:text-sm font-semibold mb-1 text-destructive flex items-center"><AlertTriangle size={isMobile ? 12 : 14} className="mr-1"/>Estoque Baixo</h3>
                        {lowStockProducts.length > 0 ? (
                            <ul className="divide-y divide-border/30">
                                {lowStockProducts.map(p => <ProductListItem key={p.id} product={p} type="low" isMobile={isMobile} />)}
                            </ul>
                        ) : <p className="text-muted-foreground text-xs">Nenhum produto com estoque baixo.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default StockSummary;