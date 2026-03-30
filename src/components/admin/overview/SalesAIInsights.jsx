import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Lightbulb, TrendingUp, TrendingDown, Award, AlertTriangle, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const InsightCard = ({ icon, title, text, colorClass, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`flex items-start p-3 rounded-lg bg-background/50 border ${colorClass || 'border-border/30'}`}
    >
        <div className={`mr-3 p-2 rounded-full bg-primary/10 ${colorClass}`}>
            {React.cloneElement(icon, { className: 'w-5 h-5' })}
        </div>
        <div>
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{text}</p>
        </div>
    </motion.div>
);

const SalesAIInsights = ({ data, filteredData }) => {
    const insights = useMemo(() => {
        const generatedInsights = [];
        if (!data || !filteredData || !data.distributors || !data.opportunities) {
            return [];
        }

        const { opportunities } = filteredData;
        const { distributors } = data;

        // 1. Top Performer Insight
        const salesByDistributor = opportunities
            .filter(op => op.status === 'sale_made')
            .reduce((acc, op) => {
                const distId = op.distributor_id;
                if (!acc[distId]) {
                    acc[distId] = { totalValue: 0, salesCount: 0 };
                }
                acc[distId].totalValue += op.sale_value || 0;
                acc[distId].salesCount += 1;
                return acc;
            }, {});

        const topDistributorId = Object.keys(salesByDistributor).sort((a, b) => salesByDistributor[b].totalValue - salesByDistributor[a].totalValue)[0];
        if (topDistributorId) {
            const topDistributor = distributors.find(d => d.id === topDistributorId);
            if (topDistributor) {
                generatedInsights.push({
                    id: 'top_performer',
                    icon: <Award />,
                    title: 'Distribuidor em Destaque',
                    text: `${topDistributor.name} está liderando em vendas com ${formatCurrency(salesByDistributor[topDistributorId].totalValue)}. Considere reconhecer o bom trabalho!`,
                    colorClass: 'text-green-500 border-green-500/20'
                });
            }
        }

        // 2. Underperformer Insight
        const totalSales = Object.values(salesByDistributor).reduce((sum, d) => sum + d.totalValue, 0);
        const averageSale = distributors.length > 0 ? totalSales / Object.keys(salesByDistributor).length : 0;
        
        const underperformers = distributors.filter(d => {
            const distSales = salesByDistributor[d.id]?.totalValue || 0;
            return distSales > 0 && distSales < averageSale / 2;
        });

        if (underperformers.length > 0) {
            const underperformer = underperformers[0];
            generatedInsights.push({
                id: 'underperformer',
                icon: <TrendingDown />,
                title: 'Oportunidade de Melhoria',
                text: `${underperformer.name} está com vendas abaixo da média. Uma sessão de treinamento ou alinhamento pode impulsionar os resultados.`,
                colorClass: 'text-yellow-500 border-yellow-500/20'
            });
        }

        // 3. Best Selling Product Insight
        const productSales = filteredData.opportunityProducts.reduce((acc, item) => {
            const productName = item.product?.name || 'Desconhecido';
            if (!acc[productName]) {
                acc[productName] = { quantity: 0, value: 0 };
            }
            acc[productName].quantity += item.quantity_sold || 0;
            acc[productName].value += (item.quantity_sold || 0) * (item.unit_sale_price_at_sale || 0);
            return acc;
        }, {});

        const topProduct = Object.keys(productSales).sort((a, b) => productSales[b].quantity - productSales[a].quantity)[0];
        if (topProduct && topProduct !== 'Desconhecido') {
            generatedInsights.push({
                id: 'top_product',
                icon: <TrendingUp />,
                title: 'Produto Campeão',
                text: `O produto "${topProduct}" é o mais vendido em unidades. Verifique o estoque e considere promoções para alavancar ainda mais.`,
                colorClass: 'text-blue-500 border-blue-500/20'
            });
        }

        // 4. Inactive Distributor Insight
        const activeDistributorIds = new Set(Object.keys(salesByDistributor));
        const inactiveDistributors = distributors.filter(d => !activeDistributorIds.has(d.id));
        if (inactiveDistributors.length > 0 && opportunities.length > 0) {
            generatedInsights.push({
                id: 'inactive_distributor',
                icon: <AlertTriangle />,
                title: 'Distribuidor Inativo',
                text: `${inactiveDistributors[0].name} não registrou vendas no período filtrado. Um contato para entender a situação pode ser valioso.`,
                colorClass: 'text-red-500 border-red-500/20'
            });
        }
        
        // 5. General Business Model Insight
        generatedInsights.push({
            id: 'business_model_tip',
            icon: <Sparkles />,
            title: 'Dica Estratégica',
            text: 'Modelos de distribuição de sucesso focam em treinamento contínuo e metas claras. Avalie criar um programa de incentivos trimestral.',
            colorClass: 'text-purple-500 border-purple-500/20'
        });

        return generatedInsights.slice(0, 4); // Limit to 4 insights for a clean UI

    }, [data, filteredData]);

    if (insights.length === 0) {
        return null;
    }

    return (
        <Card className="card-gradient shadow-xl border-border/30">
            <CardHeader>
                <CardTitle className="text-lg text-gradient flex items-center">
                    <BrainCircuit className="w-6 h-6 mr-3 text-primary" />
                    Insight IA
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((insight, index) => (
                        <InsightCard key={insight.id} index={index} {...insight} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default SalesAIInsights;