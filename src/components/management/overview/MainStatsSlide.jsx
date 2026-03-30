import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, Gem, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SparkAreaChart } from '@/components/SparkAreaChart';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useLocalization } from '@/contexts/LocalizationContext';

const StatCard = ({ title, value, icon: Icon, trendData, color, buttonText, onButtonClick }) => {
    const { t } = useLocalization();

    return (
        <Card className="bg-[#1C202C] border-none shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${color}`} />
            </CardHeader>
            <CardContent className="flex flex-col">
                <div className="text-2xl font-bold text-white">{value}</div>
                {trendData && (
                    <div className="h-12 w-full mt-2">
                        <SparkAreaChart data={trendData} dataKey="value" color={color} />
                    </div>
                )}
                {buttonText && onButtonClick && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={`mt-4 w-full bg-[#2A2F3D] border-${color}/40 text-${color} hover:bg-${color}/10 transition-all duration-300`}
                        onClick={onButtonClick}
                    >
                        {buttonText}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

const MainStatsSlide = ({ user, stats, trendData, activityData, onNavigateToStock }) => {
    const { t } = useLocalization();

    return (
        <div className="px-6 flex flex-col min-h-screen">
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-3xl font-extrabold tracking-tight text-white mb-6 text-center pt-8"
            >
                Olá, {user?.name?.split(' ')[0]}!
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
            >
                <StatCard
                    title={t('tokens')}
                    value={formatNumber(stats.tokens)}
                    icon={Gem}
                    color="cyan-400"
                    buttonText={t('buyTokens')}
                    onButtonClick={() => { /* Implement buy tokens logic */ }}
                />
                <StatCard
                    title={t('points')}
                    value={formatNumber(stats.points)}
                    icon={TrendingUp}
                    color="yellow-400"
                    buttonText={t('seeRanking')}
                    onButtonClick={() => { /* Implement see ranking logic */ }}
                />
                <StatCard
                    title={t('totalPaid')}
                    value={formatCurrency(stats.totalPaid)}
                    icon={DollarSign}
                    color="emerald-400"
                    trendData={trendData}
                    buttonText={t('financialOverview')}
                    onButtonClick={() => { /* Implement financial overview logic */ }}
                />
                <StatCard
                    title={t('totalProductsInStock')}
                    value={formatNumber(user?.total_products || 0)}
                    icon={ShoppingCart}
                    color="violet-400"
                    buttonText={t('manageStock')}
                    onButtonClick={onNavigateToStock}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex-grow flex items-center justify-center p-8 bg-[#1C202C] rounded-xl shadow-lg border border-white/5"
            >
                <p className="text-white/50 text-lg">Seções adicionais em breve...</p>
            </motion.div>
        </div>
    );
};

export default MainStatsSlide;