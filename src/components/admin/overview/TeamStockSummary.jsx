import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { motion } from 'framer-motion';

const TeamStockSummary = ({ products, distributors, title = "Resumo do Estoque Consolidado" }) => {
    const stockAnalysis = useMemo(() => {
        if (!products || products.length === 0) {
            return {
                totalUniqueProducts: 0,
                totalStockValue: 0,
                totalPotentialRevenue: 0,
                totalUnits: 0,
                lowStockProductsCount: 0,
                outOfStockProductsCount: 0
            };
        }

        let totalStockValue = 0;
        let totalPotentialRevenue = 0;
        let totalUnits = 0;
        let lowStockProductsCount = 0;
        let outOfStockProductsCount = 0;

        const productStockMap = new Map();

        products.forEach(product => {
            const stockValue = (product.cost_price || 0) * (product.quantity_in_stock || 0);
            const potentialRevenue = (product.sale_price || 0) * (product.quantity_in_stock || 0);
            
            totalStockValue += stockValue;
            totalPotentialRevenue += potentialRevenue;
            totalUnits += product.quantity_in_stock || 0;

            if (product.quantity_in_stock <= 0) {
                outOfStockProductsCount++;
            } else if (product.quantity_in_stock <= (product.low_stock_threshold || 0)) {
                lowStockProductsCount++;
            }

            const existing = productStockMap.get(product.name);
            if (existing) {
                existing.quantity += product.quantity_in_stock;
            } else {
                productStockMap.set(product.name, {
                    name: product.name,
                    quantity: product.quantity_in_stock
                });
            }
        });

        return {
            totalUniqueProducts: productStockMap.size,
            totalStockValue,
            totalPotentialRevenue,
            totalUnits,
            lowStockProductsCount,
            outOfStockProductsCount
        };
    }, [products, distributors]);

    const stats = [
        {
            title: "Valor em Estoque (Custo)",
            value: formatCurrency(stockAnalysis.totalStockValue),
            icon: TrendingDown,
            color: "text-green-500",
        },
        {
            title: "Receita Potencial (Venda)",
            value: formatCurrency(stockAnalysis.totalPotentialRevenue),
            icon: TrendingUp,
            color: "text-blue-500",
        },
        {
            title: "Margem Potencial",
            value: formatCurrency(stockAnalysis.totalPotentialRevenue - stockAnalysis.totalStockValue),
            icon: DollarSign,
            color: "text-primary",
        },
        {
            title: "Total de Unidades",
            value: formatNumberWithSuffix(stockAnalysis.totalUnits, 0),
            icon: Package,
            color: "text-foreground",
        },
        {
            title: "Produtos (SKUs)",
            value: stockAnalysis.totalUniqueProducts,
            icon: Package,
            color: "text-foreground",
        },
        {
            title: "Estoque Baixo",
            value: stockAnalysis.lowStockProductsCount,
            icon: AlertTriangle,
            color: "text-yellow-500",
        },
        {
            title: "Sem Estoque",
            value: stockAnalysis.outOfStockProductsCount,
            icon: AlertTriangle,
            color: "text-destructive",
        },
    ];

    return (
        <Card className="card-gradient shadow-xl">
            <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-gradient flex items-center">
                    <Package className="w-6 h-6 mr-2 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-background/50 p-4 rounded-lg border flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.title}</p>
                            <stat.icon className={`w-5 h-5 hidden sm:block ${stat.color}`} />
                        </div>
                        <p className={`text-xl sm:text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
};

export default TeamStockSummary;