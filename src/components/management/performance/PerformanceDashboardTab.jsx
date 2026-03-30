import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import KpiCard from './KpiCard';
import PerformanceChart from './PerformanceChart';
import ConsultantPerformanceChart from './ConsultantPerformanceChart';

const PerformanceDashboardTab = ({ user }) => {
    const [dateRange, setDateRange] = useState('current_month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const { startDate, endDate } = useMemo(() => {
        const today = new Date();
        if (dateRange === 'current_month') {
            return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
        }
        if (dateRange === 'last_month') {
            const lastMonth = subMonths(today, 1);
            return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
        }
        if (dateRange === 'last_3_months') {
            return { startDate: startOfMonth(subMonths(today, 2)), endDate: endOfMonth(today) };
        }
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    }, [dateRange]);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user?.id || !startDate || !endDate) return;

            setLoading(true);
            try {
                const { data: result, error } = await supabase.rpc('get_performance_dashboard_data', {
                    p_distributor_id: user.id,
                    p_start_date: format(startDate, 'yyyy-MM-dd'),
                    p_end_date: format(endDate, 'yyyy-MM-dd'),
                });

                if (error) throw error;
                setData(result);
            } catch (error) {
                toast({
                    title: 'Erro ao carregar dados',
                    description: 'Não foi possível buscar os dados de desempenho.',
                    variant: 'destructive',
                });
                console.error('Performance data error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, startDate, endDate, toast]);

    const kpiStats = data?.kpi_stats || {};

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <Card className="bg-card/60 backdrop-blur-sm border-border/30 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-gradient">Seu Desempenho</CardTitle>
                            <CardDescription>Métricas e resultados do seu trabalho.</CardDescription>
                        </div>
                        <Select onValueChange={setDateRange} defaultValue={dateRange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current_month">Este mês</SelectItem>
                                <SelectItem value="last_month">Mês passado</SelectItem>
                                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <KpiCard title="Faturamento Total" value={kpiStats.total_revenue || 0} type="currency" previousValue={0} />
                        <KpiCard title="Visitas Realizadas" value={kpiStats.total_visits || 0} previousValue={0} />
                        <KpiCard title="Taxa de Conversão" value={kpiStats.conversion_rate || 0} type="percentage" previousValue={0} />
                        <KpiCard title="Comissões (Consultores)" value={kpiStats.total_commissions || 0} type="currency" previousValue={0} />
                        <KpiCard title="Lucro Líquido" value={kpiStats.total_profit || 0} type="currency" previousValue={0} />
                        <KpiCard title="Pontos Gerados" value={kpiStats.total_points || 0} previousValue={0} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PerformanceChart data={data?.historical_performance} />
                        <ConsultantPerformanceChart data={data?.consultant_performance} />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PerformanceDashboardTab;