import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import AnimatedCounter from '@/components/management/goals/AnimatedCounter';
import { useLocalization } from '@/contexts/LocalizationContext';

const KpiCard = ({ title, value, icon: Icon, loading, formatFunc, suffix, decimalPlaces, type }) => {
    const { formatMoney } = useLocalization();
    
    let displayFormat = formatFunc;

    // Auto-detect financial metrics based on keywords if type is not explicitly currency
    const isFinancial = type === 'currency' || 
                        (typeof title === 'string' && ['venda', 'lucro', 'faturamento', 'ticket', 'custo', 'receita', 'investido', 'revenue', 'profit', 'sales', 'cost'].some(term => title.toLowerCase().includes(term)));

    if (isFinancial) {
        displayFormat = formatMoney;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
            className="h-full"
        >
            <Card className="card-gradient-subtle h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-start items-center h-10">
                           <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="text-2xl font-bold text-foreground">
                            <AnimatedCounter value={value} formatFunc={displayFormat} decimalPlaces={decimalPlaces} />
                            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default KpiCard;