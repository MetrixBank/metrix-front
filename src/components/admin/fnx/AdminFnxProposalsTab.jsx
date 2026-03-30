import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, CalendarDays, Percent, Loader2 } from 'lucide-react';
import useFnxProposalsData from './hooks/useFnxProposalsData';
import FnxKpiCard from './FnxKpiCard';
import MonthlyCashflowChart from './MonthlyCashflowChart';
import ReceivablesPortfolioChart from './ReceivablesPortfolioChart';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { addDays } from 'date-fns';

const AdminFnxProposalsTab = () => {
    const [date, setDate] = useState({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const { data, loading, error, refetch } = useFnxProposalsData(date.from, date.to);

    const handleDateChange = (newDate) => {
        if (newDate?.from && newDate?.to) {
            setDate(newDate);
            refetch(newDate.from, newDate.to);
        }
    };

    const portfolioData = [
        { name: 'Pago', value: data?.portfolio_summary?.paid || 0, fill: 'hsl(var(--chart-1))' },
        { name: 'Pendente', value: data?.portfolio_summary?.pending || 0, fill: 'hsl(var(--chart-2))' },
        { name: 'Vencido', value: data?.portfolio_summary?.overdue || 0, fill: 'hsl(var(--chart-5))' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gradient">FNX Bank - Análise de Propostas</h2>
                <DatePickerWithRange date={date} onDateChange={handleDateChange} />
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loader" className="flex items-center justify-center h-96" exit={{ opacity: 0 }}>
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </motion.div>
                ) : error ? (
                    <motion.div key="error" className="text-center text-destructive py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Erro ao carregar os dados. Por favor, tente novamente mais tarde.
                    </motion.div>
                ) : (
                    <motion.div
                        key="data"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FnxKpiCard
                                title="Valor Total Negociado"
                                value={data.total_negotiated}
                                icon={Banknote}
                                format="currency"
                                description={`Período: ${format(date.from, 'dd/MM/yy')} - ${format(date.to, 'dd/MM/yy')}`}
                            />
                            <FnxKpiCard
                                title="Propostas Aprovadas"
                                value={data.total_approved}
                                icon={CalendarDays}
                                format="integer"
                                description="Propostas que se tornaram contratos."
                            />
                            <FnxKpiCard
                                title="Taxa de Juros Média"
                                value={1.99} // Valor estático como placeholder
                                icon={Percent}
                                format="percentage"
                                description="Média ponderada da carteira."
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3">
                                <MonthlyCashflowChart data={data.monthly_cashflow} />
                            </div>
                            <div className="lg:col-span-2">
                                <ReceivablesPortfolioChart data={portfolioData} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminFnxProposalsTab;