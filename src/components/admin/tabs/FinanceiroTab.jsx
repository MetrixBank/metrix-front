import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import TokenManagementSection from '@/components/admin/financial/TokenManagementSection';

const FinanceiroTab = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [filters, setFilters] = useState({
        startDate: startOfMonth(new Date()).toISOString().split('T')[0],
        endDate: endOfMonth(new Date()).toISOString().split('T')[0],
        type: 'all',
        searchTerm: ''
    });

    const fetchFinancialData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('horizons_financial_entries')
                .select('*, profile:profiles(name)')
                .gte('due_date', filters.startDate)
                .lte('due_date', filters.endDate)
                .order('due_date', { ascending: false });

            if (filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            const { data, error } = await query;
            if (error) throw error;

            setTransactions(data || []);

            // Calculate Summary
            const income = (data || []).filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const expense = (data || []).filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
            setSummary({ income, expense, balance: income - expense });

        } catch (error) {
            console.error("Financial Data Error:", error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate, filters.type]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const filteredTransactions = transactions.filter(t => 
        t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.profile?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* 1. Cashflow Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500" /> Fluxo de Caixa (Real)
                    </h1>
                    <div className="flex gap-2">
                        <Input 
                            type="date" 
                            value={filters.startDate} 
                            onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                            className="bg-slate-800 border-slate-700 w-auto text-white"
                        />
                        <Input 
                            type="date" 
                            value={filters.endDate} 
                            onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                            className="bg-slate-800 border-slate-700 w-auto text-white"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-emerald-500/10 border-emerald-500/20">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-400">Entradas Totais</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" /> {formatCurrency(summary.income)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/20">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-400">Saídas Totais</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white flex items-center">
                                <TrendingDown className="w-5 h-5 mr-2" /> {formatCurrency(summary.expense)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={`border-opacity-20 ${summary.balance >= 0 ? 'bg-blue-500/10 border-blue-500' : 'bg-orange-500/10 border-orange-500'}`}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-400">Saldo Líquido</CardTitle></CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold flex items-center ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                <DollarSign className="w-5 h-5 mr-2" /> {formatCurrency(summary.balance)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table */}
                <Card className="card-gradient">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar transação..." 
                                    className="pl-8 bg-slate-900 border-slate-700 text-white"
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({...prev, type: val}))}>
                                    <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="income">Entradas</SelectItem>
                                        <SelectItem value="expense">Saídas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">Nenhuma transação encontrada.</div>
                        ) : (
                            <div className="rounded-md border border-white/5 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-800/50">
                                        <TableRow>
                                            <TableHead>Data Venc.</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Responsável</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map(t => (
                                            <TableRow key={t.id} className="hover:bg-white/5">
                                                <TableCell className="font-mono text-sm text-slate-300">{formatDate(t.due_date)}</TableCell>
                                                <TableCell className="font-medium text-white">{t.description}</TableCell>
                                                <TableCell className="text-slate-400 capitalize">{t.income_category || t.expense_category || 'Geral'}</TableCell>
                                                <TableCell className="text-slate-400">{t.profile?.name || '-'}</TableCell>
                                                <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={t.status === 'paid' ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}>
                                                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 2. Token Management Section */}
            <TokenManagementSection user={user} />
        </div>
    );
};

export default FinanceiroTab;