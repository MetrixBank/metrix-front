import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const StatCard = ({ title, value, icon, color, loading }) => (
    <Card className="bg-card/60 backdrop-blur-sm border-border/30 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {React.createElement(icon, { className: `h-5 w-5 ${color}` })}
        </CardHeader>
        <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold text-foreground">{value}</div>
            )}
        </CardContent>
    </Card>
);

const ReceivablesSchedule = ({ receivables, loading }) => {
    const totalPending = receivables
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalPaid = receivables
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + Number(r.amount), 0);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <Badge variant="success">Pago</Badge>;
            case 'pending':
                return <Badge variant="warning">Pendente</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
             <div className="grid gap-4 md:grid-cols-2">
                <StatCard title="Total a Receber" value={formatCurrency(totalPending)} icon={Wallet} color="text-yellow-400" loading={loading} />
                <StatCard title="Total Recebido" value={formatCurrency(totalPaid)} icon={DollarSign} color="text-green-400" loading={loading} />
            </div>

            <Card className="bg-card/60 backdrop-blur-sm border-border/30 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Agenda de Recebimentos</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Acompanhe as parcelas dos seus contratos aprovados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center p-8 h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[60vh] w-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Contrato (ID)</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receivables.length > 0 ? (
                                        receivables.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{formatDate(item.due_date)}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{item.proposal_id.substring(0, 8)}...</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="4" className="h-24 text-center">
                                                Nenhum recebimento agendado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ReceivablesSchedule;