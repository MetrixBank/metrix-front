import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, differenceInDays, format as formatDateFns, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, formatCurrencyUSD, formatDecimal } from '@/lib/utils';
import { 
    BarChart2, DollarSign, Star, Coins, Target, TrendingUp, Gem, 
    Ticket, Loader2, Package, PlusCircle, X, 
    Sparkles, BrainCircuit, Activity
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useMediaQuery from '@/hooks/useMediaQuery';
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import PerformanceChart from './performance/PerformanceChart';
import ConsultantPerformanceChart from './performance/ConsultantPerformanceChart';
import ProductPerformanceChart from './performance/ProductPerformanceChart';
import AnimatedCounter from '@/components/management/goals/AnimatedCounter';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import AddProductModal from '@/components/AddProductModal';

// --- Helper for Trend Calculation ---
const calculateTrendPercentage = (current, previous) => {
    if (!previous || previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
};

// --- Components for the new structure ---

const MainKpiCard = ({ title, value, icon: Icon, trend, subtext, loading, formatFunc, suffix }) => (
    <div className="bg-[#161922] border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg group hover:border-violet-500/20 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-16 h-16 text-white" />
        </div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">{title}</p>
                <div className="text-2xl font-bold text-white">
                    {loading ? <div className="h-8 w-24 bg-white/5 animate-pulse rounded"/> : (
                        <>
                           <AnimatedCounter value={value || 0} formatFunc={formatFunc} />
                           {suffix && <span className="text-sm font-normal text-white/50 ml-1">{suffix}</span>}
                        </>
                    )}
                </div>
            </div>
            <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${trend > 0 ? 'text-emerald-400' : 'text-violet-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-2 relative z-10">
            {!loading && trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {trend > 0 ? '+' : ''}{formatDecimal(Math.abs(trend), 1)}%
                </div>
            )}
            <span className="text-[10px] text-white/30">{subtext || "vs. período anterior"}</span>
        </div>
    </div>
);

const SecondaryKpiCard = ({ title, value, icon: Icon, colorClass, loading, formatFunc }) => (
    <div className="bg-[#161922]/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-[#161922] transition-colors relative overflow-hidden group">
         <div className={`absolute right-0 top-0 bottom-0 w-1 ${colorClass} opacity-20`} />
         <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
             <Icon className="w-5 h-5" />
         </div>
         <div>
             <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{title}</p>
             <div className="text-lg font-bold text-white">
                 {loading ? <div className="h-6 w-16 bg-white/5 animate-pulse rounded"/> : (
                     <AnimatedCounter value={value || 0} formatFunc={formatFunc} />
                 )}
             </div>
         </div>
    </div>
);

const ContextualBanner = ({ message, actionLabel, onAction, onClose, type = 'info' }) => {
    const styles = {
        info: "bg-violet-500/10 border-violet-500/20 text-violet-200",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-200",
        success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
    };

    return (
        <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`w-full rounded-xl border p-4 flex items-center justify-between gap-4 mb-6 ${styles[type]}`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/10 shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-semibold">{message}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {actionLabel && (
                    <Button size="sm" onClick={onAction} className="bg-white/10 hover:bg-white/20 text-white border-0 h-8 text-xs font-medium">
                        {actionLabel}
                    </Button>
                )}
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

const PerformanceDashboardTab = () => {
    const { user } = useAuth();
    const { syncKey, triggerSync } = useDataSync();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Determine currency formatter
    const isUSA = user?.region === 'USA';
    const formatFunc = isUSA ? formatCurrencyUSD : formatCurrency;
    
    // Current Stats
    const [kpiData, setKpiData] = useState({
        revenue: 0, profit: 0, points: 0, commissions: 0, 
        total_visits: 0, conversion_rate: 0, tokens: 0, average_ticket: 0,
    });
    
    // Previous Stats for Trends
    const [prevKpiData, setPrevKpiData] = useState({
        revenue: 0, profit: 0, average_ticket: 0, conversion_rate: 0
    });

    const [trendLabel, setTrendLabel] = useState("vs. período anterior");

    const [chartData, setChartData] = useState([]);
    const [consultantData, setConsultantData] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [productPerformanceData, setProductPerformanceData] = useState([]);
    const [showBanner, setShowBanner] = useState(true);
    
    // Modals
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const { toast } = useToast();
    const isMobile = useMediaQuery("(max-width: 768px)");
    
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) {
            setDateRange({
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date()),
            });
        }
    }, []);

    const handleDatePreset = (preset) => {
        const now = new Date();
        let from, to;
        switch (preset) {
            case 'this_month': from = startOfMonth(now); to = endOfMonth(now); break;
            case 'last_month': const last = subMonths(now, 1); from = startOfMonth(last); to = endOfMonth(last); break;
            case 'this_year': from = startOfYear(now); to = endOfYear(now); break;
            case 'last_year': 
                const lastYear = subYears(now, 1);
                from = startOfYear(lastYear); 
                to = endOfYear(lastYear); 
                break;
            default: from = startOfMonth(now); to = endOfMonth(now);
        }
        setDateRange({ from, to });
    };

    const fetchData = useCallback(async () => {
        if (!user || !dateRange.from || !dateRange.to) return;
        setLoading(true);
        try {
            const startDateStr = dateRange.from.toISOString().split('T')[0];
            const endDateStr = dateRange.to.toISOString().split('T')[0];

            const daysDiff = Math.abs(differenceInDays(dateRange.to, dateRange.from));
            const isYearView = daysDiff > 300; 

            let prevStartDate, prevEndDate;
            
            if (isYearView) {
                 prevStartDate = subYears(dateRange.from, 1);
                 prevEndDate = subYears(dateRange.to, 1);
                 setTrendLabel("vs. ano anterior");
            } else {
                 prevStartDate = subMonths(dateRange.from, 1);
                 prevEndDate = subMonths(dateRange.to, 1);
                 setTrendLabel("vs. mês anterior");
            }

            const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
            const prevEndDateStr = prevEndDate.toISOString().split('T')[0];

            const [perfRes, prevPerfRes, stockRes, prodRes] = await Promise.all([
                supabase.rpc('get_performance_dashboard_data', {
                    p_distributor_id: user.id,
                    p_start_date: startDateStr,
                    p_end_date: endDateStr
                }),
                supabase.rpc('get_performance_dashboard_data', {
                    p_distributor_id: user.id,
                    p_start_date: prevStartDateStr,
                    p_end_date: prevEndDateStr
                }),
                supabase.from('products').select('*').eq('distributor_id', user.id),
                supabase.from('sales_opportunities')
                    .select('*, opportunity_products(quantity_sold, products(name))')
                    .eq('distributor_id', user.id)
                    .eq('status', 'sale_made')
                    .gte('visit_date', startDateStr)
                    .lte('visit_date', endDateStr)
            ]);

            const kpiStats = perfRes.data?.kpi_stats || {};
            const salesCount = prodRes.data?.length || (kpiStats.conversion_rate > 0 ? Math.round((kpiStats.total_visits * kpiStats.conversion_rate) / 100) : 0);
            const avgTicket = salesCount > 0 ? (kpiStats.total_revenue / salesCount) : 0;

            setKpiData({
                revenue: kpiStats.total_revenue || 0,
                profit: kpiStats.total_profit || 0,
                points: kpiStats.total_points || 0,
                commissions: kpiStats.total_commissions || 0,
                total_visits: kpiStats.total_visits || 0,
                conversion_rate: kpiStats.conversion_rate || 0,
                tokens: kpiStats.total_tokens || 0,
                average_ticket: avgTicket,
            });

            const prevStats = prevPerfRes.data?.kpi_stats || {};
            const prevSalesCount = prevPerfRes.data?.consultant_performance?.reduce((sum, item) => sum + item.sales, 0) || 0; 
            const prevAvgTicket = prevSalesCount > 0 ? (prevStats.total_revenue / prevSalesCount) : 0;

            setPrevKpiData({
                revenue: prevStats.total_revenue || 0,
                profit: prevStats.total_profit || 0,
                conversion_rate: prevStats.conversion_rate || 0,
                average_ticket: prevAvgTicket
            });

            setChartData(perfRes.data?.historical_performance || []);
            setConsultantData(perfRes.data?.consultant_performance || []);
            setStockData(stockRes.data || []);

            const prodPerf = {};
            if (prodRes.data) {
                prodRes.data.forEach(sale => {
                    if (sale.opportunity_products) {
                        sale.opportunity_products.forEach(item => {
                            const name = item.products?.name || 'Desconhecido';
                            prodPerf[name] = (prodPerf[name] || 0) + (item.quantity_sold || 0);
                        });
                    }
                });
            }
            setProductPerformanceData(Object.entries(prodPerf).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value));

        } catch (error) {
            console.error("Error fetching performance data:", error);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange]);

    useEffect(() => { 
        if(user && dateRange.from && dateRange.to) {
            fetchData(); 
        }
    }, [fetchData, syncKey]);

    const formattedChartData = useMemo(() => {
        if (!chartData || !Array.isArray(chartData)) return [];
        return chartData.map(item => ({
            month: item.month ? formatDateFns(parseISO(item.month), 'MMM', { locale: ptBR }) : 'N/A',
            Vendas: parseFloat(item.total_revenue) || 0,
            Lucro: parseFloat(item.total_profit) || 0
        }));
    }, [chartData]);

    const smartInsight = useMemo(() => {
        if (!stockData || stockData.length === 0) return {
            msg: "Seu estoque está vazio. Cadastre produtos para desbloquear previsões de venda.",
            action: "Cadastrar Estoque",
            handler: () => setIsProductModalOpen(true),
            type: "warning"
        };
        if (!kpiData || kpiData.total_visits === 0) return {
            msg: "Nenhuma atividade registrada no período. Registre visitas para ver sua taxa de conversão.",
            action: "Registrar Atividade",
            handler: () => setIsActivityModalOpen(true),
            type: "info"
        };
        if (kpiData.conversion_rate < 10 && kpiData.total_visits > 5) return {
            msg: "Sua conversão está abaixo de 10%. Tente oferecer produtos de entrada para aquecer os leads.",
            action: null,
            type: "warning"
        };
        return null;
    }, [stockData, kpiData]);

    const handleActionComplete = () => {
        triggerSync();
        setIsActivityModalOpen(false);
        setIsProductModalOpen(false);
    };

    const handleNavigateToStock = () => {
        navigate('/dashboard?tab=stock');
        window.scrollTo(0, 0);
    };

    if (loading && (!kpiData.revenue && !chartData.length)) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>;
    }

    return (
        <div className="flex flex-col gap-6 p-4 max-w-[1600px] mx-auto pb-20 md:pb-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Performance MÉTRIX</h1>
                    <p className="text-white/50 text-sm">Visão estratégica dos seus resultados e próximos passos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-[#161922] p-1 rounded-lg border border-white/5">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} className="bg-transparent border-none text-white w-auto" />
                    <div className="h-4 w-px bg-white/10 mx-2 hidden md:block"></div>
                    <Select onValueChange={handleDatePreset} defaultValue="this_month">
                        <SelectTrigger className="w-[140px] bg-transparent border-none text-white h-8">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161922] border-white/10 text-white">
                            <SelectItem value="this_month">Este Mês</SelectItem>
                            <SelectItem value="last_month">Mês Passado</SelectItem>
                            <SelectItem value="this_year">Este Ano</SelectItem>
                            <SelectItem value="last_year">Ano Passado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MainKpiCard 
                    title="Vendas Totais" 
                    value={kpiData.revenue} 
                    icon={DollarSign} 
                    trend={calculateTrendPercentage(kpiData.revenue, prevKpiData.revenue)} 
                    subtext={trendLabel}
                    formatFunc={formatFunc} 
                    loading={loading}
                />
                <MainKpiCard 
                    title="Lucro Líquido" 
                    value={kpiData.profit} 
                    icon={BarChart2} 
                    trend={calculateTrendPercentage(kpiData.profit, prevKpiData.profit)} 
                    subtext={trendLabel}
                    formatFunc={formatFunc} 
                    loading={loading}
                />
                <MainKpiCard 
                    title="Ticket Médio" 
                    value={kpiData.average_ticket} 
                    icon={Ticket} 
                    trend={calculateTrendPercentage(kpiData.average_ticket, prevKpiData.average_ticket)}
                    subtext={trendLabel}
                    formatFunc={formatFunc} 
                    loading={loading}
                />
                <MainKpiCard 
                    title="Taxa de Conversão" 
                    value={kpiData.conversion_rate} 
                    icon={Target} 
                    trend={calculateTrendPercentage(kpiData.conversion_rate, prevKpiData.conversion_rate)}
                    subtext={trendLabel}
                    formatFunc={formatDecimal} 
                    decimalPlaces={1}
                    suffix="%" 
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                    onClick={() => setIsActivityModalOpen(true)}
                    className="h-14 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 border-0 text-base font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                    <PlusCircle className="w-5 h-5" />
                    Registrar Nova Atividade
                </Button>
                <Button 
                    onClick={handleNavigateToStock}
                    className="h-14 bg-[#161922] hover:bg-[#1f232e] text-violet-300 border border-violet-500/30 text-base font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                    <Package className="w-5 h-5" />
                    Estoque
                </Button>
            </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SecondaryKpiCard 
                    title="Pontos Vendidos"
                    value={kpiData.points}
                    icon={Star}
                    colorClass="text-amber-400"
                    loading={loading}
                    formatFunc={(v) => formatDecimal(v, 2)}
                />
                <SecondaryKpiCard 
                    title="Tokens Acumulados"
                    value={kpiData.tokens}
                    icon={Gem}
                    colorClass="text-cyan-400"
                    loading={loading}
                    formatFunc={(v) => formatDecimal(v, 2)}
                />
                <SecondaryKpiCard 
                    title="Comissões Pagas"
                    value={kpiData.commissions}
                    icon={Coins}
                    colorClass="text-emerald-400"
                    loading={loading}
                    formatFunc={formatFunc}
                />
                <SecondaryKpiCard 
                    title="Atividades Totais"
                    value={kpiData.total_visits}
                    icon={Activity}
                    colorClass="text-violet-400"
                    loading={loading}
                />
            </div>

            <AnimatePresence>
                {showBanner && smartInsight && (
                    <ContextualBanner 
                        message={smartInsight.msg}
                        actionLabel={smartInsight.action}
                        onAction={smartInsight.handler}
                        onClose={() => setShowBanner(false)}
                        type={smartInsight.type}
                    />
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <PerformanceChart 
                        title="Evolução Vendas x Lucro"
                        icon="TrendingUpIcon"
                        data={formattedChartData}
                        isMobile={isMobile}
                    />
                    
                    {chartData.length === 0 && !loading && (
                        <div className="bg-[#161922] border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-white/5 rounded-full mb-4">
                                <BrainCircuit className="w-8 h-8 text-white/40" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Sem dados suficientes para análise</h3>
                            <p className="text-white/50 max-w-md mb-6">
                                O Sales Copilot precisa de mais dados históricos para gerar insights de tendência. Continue registrando suas vendas!
                            </p>
                            <Button onClick={() => setIsActivityModalOpen(true)} variant="outline" className="border-white/10 text-white">
                                Começar Agora
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <ProductPerformanceChart data={productPerformanceData} isMobile={isMobile} />
                    
                    {consultantData.length > 0 && (
                        <ConsultantPerformanceChart data={consultantData} isMobile={isMobile} />
                    )}
                </div>
            </div>

            <AddSalesActivityModal 
                isOpen={isActivityModalOpen} 
                onClose={() => setIsActivityModalOpen(false)} 
                onActivityAdded={handleActionComplete}
            />
            <AddProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                user={user}
            />
        </div>
    );
};

export default PerformanceDashboardTab;