import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy as Treasure, Filter, Medal, Award, Crown, Zap } from 'lucide-react';
import JourneyKpiCard from './JourneyKpiCard';
import MonthlyComparisonChart from './MonthlyComparisonChart';
import TreasureMapChart from './TreasureMapChart';
import useAdminJourneyData from './hooks/useAdminJourneyData';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminJourneyTab = () => {
    const [distributorType, setDistributorType] = useState('all');
    const { data, loading, error } = useAdminJourneyData(distributorType);
    const { user } = useAuth(); // For potential future personalization

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 120,
                damping: 20
            },
        },
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-xl bg-violet-500/20 animate-pulse"></div>
                        <Loader2 className="w-16 h-16 animate-spin text-violet-500 relative z-10" />
                    </div>
                    <p className="text-lg font-medium text-violet-300 animate-pulse">Carregando Jornada...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center h-96 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 m-4">
                Erro ao carregar os dados da jornada. Tente novamente mais tarde.
            </div>
        );
    }

    // Mock top performers for visual enhancement (Replace with real data later)
    const topPerformers = [
        { name: "Carlos Silva", sales: 154000, avatar: "", rank: 1 },
        { name: "Ana Souza", sales: 128500, avatar: "", rank: 2 },
        { name: "Roberto Lima", sales: 98200, avatar: "", rank: 3 },
    ];

    return (
        <motion.div 
            className="p-4 sm:p-8 space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-violet-950/20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border/50" variants={itemVariants}>
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20">
                        <Treasure className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            Jornada da Conquista
                        </h2>
                        <p className="text-base text-muted-foreground mt-1">
                            Acompanhe a corrida pelo prêmio de <span className="font-bold text-amber-500">R$ 1.000.000,00</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Tabs value={distributorType} onValueChange={setDistributorType} className="w-full sm:w-auto">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Geral</TabsTrigger>
                            <TabsTrigger value="team" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Interna</TabsTrigger>
                            <TabsTrigger value="independent" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Externa</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </motion.div>

            {/* Main Treasure Map */}
            <motion.div variants={itemVariants} className="relative z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10 blur-3xl -z-10 transform scale-95 translate-y-4"></div>
                <TreasureMapChart annualTotal={data.annualJourneyTotal} />
            </motion.div>
            
            {/* Stats Grid */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={containerVariants}>
                {/* KPI Cards */}
                <motion.div className="lg:col-span-1 space-y-6" variants={itemVariants}>
                    <JourneyKpiCard 
                        title="Faturamento Mês Atual"
                        value={data.currentMonthRevenue}
                        previousValue={data.lastMonthRevenue}
                        formatAs="currency"
                        icon={Zap}
                        color="violet"
                    />
                    <JourneyKpiCard
                        title="Faturamento Mês Anterior"
                        value={data.lastMonthRevenue}
                        formatAs="currency"
                        icon={Award}
                        color="blue"
                    />
                </motion.div>

                {/* Monthly Chart */}
                <motion.div className="lg:col-span-2 h-full" variants={itemVariants}>
                     <MonthlyComparisonChart 
                        currentMonthRevenue={data.currentMonthRevenue} 
                        lastMonthRevenue={data.lastMonthRevenue} 
                    />
                </motion.div>
            </motion.div>

            {/* Competition Leaderboard Section */}
            <motion.div variants={itemVariants} className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Crown className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-bold">Podium do Mês</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* 2nd Place */}
                    <Card className="bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700 shadow-xl transform hover:scale-105 transition-all duration-300 order-2 md:order-1 h-[280px] flex flex-col justify-end relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-1 bg-slate-400"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                            <Medal className="w-12 h-12 text-slate-400 drop-shadow-md" />
                        </div>
                        <CardContent className="p-6 text-center z-10">
                            <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-slate-400 shadow-md">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topPerformers[1].name}`} />
                                <AvatarFallback>2º</AvatarFallback>
                            </Avatar>
                            <h4 className="font-bold text-lg truncate">{topPerformers[1].name}</h4>
                            <p className="text-slate-500 font-medium text-sm mb-2">Prata</p>
                            <div className="bg-background/50 rounded-full py-1 px-3 inline-block border border-slate-400/30">
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(topPerformers[1].sales)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 1st Place */}
                    <Card className="bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-950/60 border-amber-300 dark:border-amber-700 shadow-2xl shadow-amber-500/20 transform scale-105 hover:scale-110 transition-all duration-300 order-1 md:order-2 h-[320px] flex flex-col justify-end relative overflow-hidden z-10 group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute inset-x-0 top-0 h-1 bg-amber-500"></div>
                         <div className="absolute top-0 right-0 p-2">
                             <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
                         </div>
                        <div className="absolute top-6 left-1/2 -translate-x-1/2">
                            <Medal className="w-16 h-16 text-amber-500 drop-shadow-lg" />
                        </div>
                        <CardContent className="p-6 text-center z-10">
                            <div className="relative inline-block">
                                <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-amber-500 shadow-lg ring-4 ring-amber-500/20">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topPerformers[0].name}`} />
                                    <AvatarFallback>1º</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    Líder
                                </div>
                            </div>
                            <h4 className="font-bold text-xl truncate mt-2">{topPerformers[0].name}</h4>
                            <p className="text-amber-600 dark:text-amber-400 font-medium text-sm mb-3">Ouro - Campeão Atual</p>
                            <div className="bg-background/60 backdrop-blur-sm rounded-full py-1.5 px-4 inline-block border border-amber-500/50 shadow-inner">
                                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-lg">{formatCurrency(topPerformers[0].sales)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3rd Place */}
                    <Card className="bg-gradient-to-b from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-950/50 border-orange-300 dark:border-orange-800 shadow-xl transform hover:scale-105 transition-all duration-300 order-3 h-[260px] flex flex-col justify-end relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-1 bg-orange-400"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                            <Medal className="w-12 h-12 text-orange-400 drop-shadow-md" />
                        </div>
                        <CardContent className="p-6 text-center z-10">
                            <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-orange-400 shadow-md">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topPerformers[2].name}`} />
                                <AvatarFallback>3º</AvatarFallback>
                            </Avatar>
                            <h4 className="font-bold text-lg truncate">{topPerformers[2].name}</h4>
                            <p className="text-orange-600 dark:text-orange-400 font-medium text-sm mb-2">Bronze</p>
                            <div className="bg-background/50 rounded-full py-1 px-3 inline-block border border-orange-400/30">
                                <span className="font-mono font-bold text-orange-700 dark:text-orange-300">{formatCurrency(topPerformers[2].sales)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AdminJourneyTab;