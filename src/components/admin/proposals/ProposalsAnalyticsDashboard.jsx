import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { format, startOfMonth, addMonths } from 'date-fns';
import { DollarSign, FileCheck, Percent, TrendingUp, Loader2 } from 'lucide-react';

const StatCard = ({ title, value, icon, loading, formatFn = (val) => val }) => (
    <Card className="card-gradient">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
        </CardHeader>
        <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold text-gradient">{formatFn(value)}</div>
            )}
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label, currency = false }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg text-sm">
                <p className="font-bold text-foreground capitalize">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {`${p.name}: ${currency ? formatCurrency(p.value) : p.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const STATUS_COLORS = {
    approved: '#22c55e',
    pending: '#a1a1aa',
    awaiting_analysis: '#3b82f6',
    awaiting_signature: '#06b6d4',
    rejected: '#ef4444',
    awaiting_adjustment: '#f59e0b',
};

const ProposalsAnalyticsDashboard = ({ proposals, loading }) => {
    const analyticsData = useMemo(() => {
        if (!proposals || proposals.length === 0) {
            return {
                totalApprovedValue: 0,
                averageTicket: 0,
                approvalRate: 0,
                monthlyCashflow: [],
                receivablesPortfolio: [],
                statusDistribution: [],
            };
        }

        const approvedProposals = proposals.filter(p => p.status === 'approved');
        const totalApprovedValue = approvedProposals.reduce((sum, p) => sum + Number(p.total_value), 0);
        const averageTicket = approvedProposals.length > 0 ? totalApprovedValue / approvedProposals.length : 0;
        const approvalRate = proposals.length > 0 ? (approvedProposals.length / proposals.length) * 100 : 0;

        const statusCounts = proposals.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        const today = new Date();
        const monthlyData = Array.from({ length: 6 }).map((_, i) => {
            const date = addMonths(startOfMonth(today), i);
            return {
                date,
                name: format(date, 'MMM', { locale: ptBR }),
                upfront: 0,
                installments: 0,
                receivables: 0,
            };
        });

        approvedProposals.forEach(p => {
            const proposalDate = new Date(p.updated_at); // Assuming approval date is updated_at
            const upfrontPayment = Number(p.upfront_payment);
            const installmentValue = (Number(p.total_value) - upfrontPayment) / p.installments;

            // Upfront payment cashflow
            const upfrontMonthIndex = monthlyData.findIndex(m => m.date.getMonth() === proposalDate.getMonth() && m.date.getFullYear() === proposalDate.getFullYear());
            if (upfrontMonthIndex !== -1) {
                monthlyData[upfrontMonthIndex].upfront += upfrontPayment;
            }

            // Installments cashflow and receivables
            const firstPaymentDate = new Date(p.first_payment_due_date + 'T00:00:00');
            for (let i = 0; i < p.installments; i++) {
                const paymentDate = addMonths(firstPaymentDate, i);
                const monthIndex = monthlyData.findIndex(m => m.date.getMonth() === paymentDate.getMonth() && m.date.getFullYear() === paymentDate.getFullYear());
                if (monthIndex !== -1) {
                    monthlyData[monthIndex].installments += installmentValue;
                    if (paymentDate >= today) {
                        monthlyData[monthIndex].receivables += installmentValue;
                    }
                }
            }
        });

        const monthlyCashflow = monthlyData.map(m => ({ name: m.name, Entrada: m.upfront, Parcelas: m.installments }));
        const receivablesPortfolio = monthlyData.map(m => ({ name: m.name, 'A Receber': m.receivables }));

        return { totalApprovedValue, averageTicket, approvalRate, monthlyCashflow, receivablesPortfolio, statusDistribution };
    }, [proposals]);

    const { totalApprovedValue, averageTicket, approvalRate, monthlyCashflow, receivablesPortfolio, statusDistribution } = analyticsData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Valor Total Aprovado" value={totalApprovedValue} icon={DollarSign} loading={loading} formatFn={formatCurrency} />
                <StatCard title="Ticket Médio (Aprovadas)" value={averageTicket} icon={TrendingUp} loading={loading} formatFn={formatCurrency} />
                <StatCard title="Taxa de Aprovação" value={approvalRate} icon={Percent} loading={loading} formatFn={(v) => `${v.toFixed(1)}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3 card-gradient">
                    <CardHeader>
                        <CardTitle className="text-gradient">Fluxo de Caixa Mensal (Próximos 6 meses)</CardTitle>
                        <CardDescription>Baseado em entradas e parcelas de propostas aprovadas.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyCashflow}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatNumberWithSuffix(value, 0)} />
                                <Tooltip content={<CustomTooltip currency />} cursor={{ fill: 'hsl(var(--accent) / 0.3)' }} />
                                <Legend />
                                <Bar dataKey="Entrada" stackId="a" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Parcelas" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 card-gradient">
                    <CardHeader>
                        <CardTitle className="text-gradient">Carteira de Recebíveis</CardTitle>
                        <CardDescription>Valores a receber de parcelas futuras.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={receivablesPortfolio}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatNumberWithSuffix(value, 0)} />
                                <Tooltip content={<CustomTooltip currency />} cursor={{ fill: 'hsl(var(--accent) / 0.3)' }} />
                                <Bar dataKey="A Receber" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="card-gradient">
                <CardHeader>
                    <CardTitle className="text-gradient">Distribuição por Status</CardTitle>
                    <CardDescription>Visão geral do status de todas as propostas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ProposalsAnalyticsDashboard;