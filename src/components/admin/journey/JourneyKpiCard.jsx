import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const formatValue = (value, format) => {
    if (format === 'currency') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return value;
};

const JourneyKpiCard = ({ title, value, previousValue, formatAs }) => {
    const validValue = typeof value === 'number' ? value : 0;
    const validPreviousValue = typeof previousValue === 'number' ? previousValue : null;

    let percentageChange = 0;
    if (validPreviousValue !== null && validPreviousValue > 0) {
        percentageChange = ((validValue - validPreviousValue) / validPreviousValue) * 100;
    } else if (validPreviousValue === 0 && validValue > 0) {
        percentageChange = 100;
    }

    const TrendIcon = percentageChange > 0 ? TrendingUp : percentageChange < 0 ? TrendingDown : Minus;
    const trendColor = percentageChange > 0 ? 'text-green-500' : percentageChange < 0 ? 'text-red-500' : 'text-gray-500';

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-primary">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <motion.div 
                    key={validValue}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-bold text-gray-800 dark:text-white"
                >
                    {formatValue(validValue, formatAs)}
                </motion.div>
                {validPreviousValue !== null && (
                    <motion.div 
                        key={percentageChange}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className={`flex items-center text-xs mt-1 font-semibold ${trendColor}`}
                    >
                        <TrendIcon className="h-4 w-4 mr-1" />
                        <span>
                            {percentageChange.toFixed(1)}% vs. mês anterior
                        </span>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};

export default JourneyKpiCard;