import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, PieChart as PieIcon, BarChart3, Loader2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
    startOfMonth, endOfMonth, format, startOfQuarter, endOfQuarter, startOfYear, endOfYear, 
    eachDayOfInterval, eachMonthOfInterval, getDate, isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmPaymentModal } from '@/components/modals/ConfirmPaymentModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import FinancialEntryModal from './FinancialEntryModal';
import { Skeleton } from '@/components/ui/skeleton';

const FinancialDashboard = ({ user: propUser }) => {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [period, setPeriod] = useState('month'); // 'month', 'quarter', 'year', 'custom'
  const [dateRange, setDateRange] = useState({ 
      from: startOfMonth(new Date()), 
      to: endOfMonth(new Date()) 
  });

  // Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [entryToConfirm, setEntryToConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // --- Date Range Handler ---
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const now = new Date();
    switch (newPeriod) {
        case 'month':
            setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
            break;
        case 'quarter':
            setDateRange({ from: startOfQuarter(now), to: endOfQuarter(now) });
            break;
        case 'year':
            setDateRange({ from: startOfYear(now), to: endOfYear(now) });
            break;
        case 'custom':
            // Keep current range or default to this month if needed
            break;
    }
  };

  // --- Data Fetching ---
  const fetchFinancials = useCallback(async () => {
    if (!user || !dateRange.from || !dateRange.to) return;
    
    // Background fetch if not first load
    if (entries.length === 0) setLoading(true);

    try {
      const { data, error } = await supabase
          .from('horizons_financial_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('due_date', dateRange.from.toISOString())
          .lte('due_date', dateRange.to.toISOString())
          .order('due_date', { ascending: true });
      
      if(error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, toast]);

  useEffect(() => {
      fetchFinancials();
  }, [fetchFinancials]);

  // --- Actions ---
  const handleOpenNewEntry = () => {
      setEntryToEdit(null);
      setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry) => {
      setEntryToEdit(entry);
      setIsEntryModalOpen(true);
  };

  const handleDeleteRequest = (id) => {
      setEntryToDelete(id);
      setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!entryToDelete) return;
      try {
          const { error } = await supabase
            .from('horizons_financial_entries')
            .delete()
            .eq('id', entryToDelete);
          
          if(error) throw error;

          setEntries(prev => prev.filter(e => e.id !== entryToDelete));
          toast({ title: "Excluído", description: "Lançamento removido com sucesso." });
      } catch (error) {
          toast({ title: "Erro", description: error.message, variant: "destructive" });
      } finally {
          setDeleteAlertOpen(false);
          setEntryToDelete(null);
      }
  };

  const openConfirmModal = (entry) => {
      setEntryToConfirm(entry);
      setConfirmModalOpen(true);
  };

  const handleConfirmPayment = async (entryId, paymentDate) => {
      setConfirmLoading(true);
      try {
          const { error } = await supabase
              .from('horizons_financial_entries')
              .update({ status: 'paid', due_date: paymentDate, updated_at: new Date() })
              .eq('id', entryId);

          if (error) throw error;
          
          setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: 'paid', due_date: paymentDate } : e));
          toast({ title: "Confirmado", description: "Pagamento registrado com sucesso.", variant: "success" });
          setConfirmModalOpen(false);
          setEntryToConfirm(null);
      } catch (error) {
          toast({ title: "Erro", description: error.message, variant: "destructive" });
      } finally {
          setConfirmLoading(false);
      }
  };

  const handleUnconfirmPayment = async (id) => {
      try {
        const { error } = await supabase
            .from('horizons_financial_entries')
            .update({ status: 'pending', updated_at: new Date() })
            .eq('id', id);

        if (error) throw error;
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'pending' } : e));
        toast({ title: "Atualizado", description: "Lançamento marcado como pendente." });
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
  };

  // --- Stats & Charts ---
  const stats = useMemo(() => {
      const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
      const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
      const balance = income - expense;
      const netProfit = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0);
      
      return { income, expense, balance, netProfit };
  }, [entries]);

  const chartData = useMemo(() => {
      if (!dateRange.from || !dateRange.to) return [];

      // If range is within same month -> Daily breakdown
      const isSingleMonth = isSameMonth(dateRange.from, dateRange.to);
      
      let dataPoints = [];
      if (isSingleMonth) {
          const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
          dataPoints = days.map(day => {
              const label = getDate(day).toString();
              const dayEntries = entries.filter(e => {
                  const ed = new Date(e.due_date);
                  return ed.getDate() === day.getDate();
              });
              return {
                  name: label,
                  Receitas: dayEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0),
                  Despesas: dayEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0),
                  Lucro: dayEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0)
              };
          });
      } else {
          // Monthly breakdown
          const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
          dataPoints = months.map(monthDate => {
              const label = format(monthDate, 'MMM', { locale: ptBR });
              const monthEntries = entries.filter(e => {
                  const ed = new Date(e.due_date);
                  return ed.getMonth() === monthDate.getMonth() && ed.getFullYear() === monthDate.getFullYear();
              });
              return {
                  name: label,
                  Receitas: monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0),
                  Despesas: monthEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0),
                  Lucro: monthEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0)
              };
          });
      }
      return dataPoints;
  }, [entries, dateRange]);

  const pieData = useMemo(() => {
      const categories = {};
      entries.filter(e => e.type === 'expense').forEach(e => {
          const cat = e.expense_category || 'Outros';
          categories[cat] = (categories[cat] || 0) + Number(e.amount);
      });
      return Object.keys(categories).map(k => ({ name: k, value: categories[k] }));
  }, [entries]);

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const SkeletonCard = () => (
      <Card className="bg-card">
          <CardHeader className="p-4"><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="p-4 pt-0"><Skeleton className="h-8 w-full" /></CardContent>
      </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex flex-col gap-1">
                 <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
                 <p className="text-sm text-muted-foreground">Gerencie seu fluxo de caixa e resultados.</p>
             </div>
             
             <div className="flex flex-wrap items-center gap-2">
                 <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
                     {['month', 'quarter', 'year'].map((p) => (
                        <Button 
                            key={p}
                            variant={period === p ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => handlePeriodChange(p)}
                            className={cn("h-8 text-xs px-3", period === p && "bg-white dark:bg-slate-700 shadow-sm font-semibold text-primary")}
                        >
                            {p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Anual'}
                        </Button>
                     ))}
                     
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                variant={period === 'custom' ? 'secondary' : 'ghost'} 
                                size="sm"
                                className={cn("h-8 text-xs px-3", period === 'custom' && "bg-white dark:bg-slate-700 shadow-sm font-semibold text-primary")}
                            >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {period === 'custom' && dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/yy")
                                    )
                                ) : "Personalizado"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                    if(range) {
                                        setDateRange(range);
                                        setPeriod('custom');
                                    }
                                }}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                     </Popover>
                 </div>

                 <Button size="sm" onClick={handleOpenNewEntry} className="bg-primary hover:bg-primary/90">
                     <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
                 </Button>
             </div>
        </div>

        {/* Loading / KPI Cards */}
        {loading && entries.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider">Entradas</p>
                            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-500 mt-1">{formatCurrency(stats.income)}</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-100/50 rounded-full text-emerald-600">
                             <ArrowUpCircle className="w-5 h-5"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-red-600/80 uppercase tracking-wider">Saídas</p>
                            <h3 className="text-2xl font-bold text-red-700 dark:text-red-500 mt-1">{formatCurrency(stats.expense)}</h3>
                        </div>
                        <div className="p-2.5 bg-red-100/50 rounded-full text-red-600">
                            <ArrowDownCircle className="w-5 h-5"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-violet-500/5 border-violet-500/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-violet-600/80 uppercase tracking-wider">Saldo</p>
                            <h3 className="text-2xl font-bold text-violet-700 dark:text-violet-500 mt-1">{formatCurrency(stats.balance)}</h3>
                        </div>
                        <div className="p-2.5 bg-violet-100/50 rounded-full text-violet-600">
                            <Wallet className="w-5 h-5"/>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider">Lucro Líquido</p>
                            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-500 mt-1">{formatCurrency(stats.netProfit)}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-100/50 rounded-full text-amber-600">
                            <TrendingUp className="w-5 h-5"/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Content Area */}
        <Tabs defaultValue="overview" className="space-y-4">
            <div className="flex items-center justify-between">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="statement">Extrato Detalhado</TabsTrigger>
                    <TabsTrigger value="projections">Projeções</TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="overview" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                {loading && entries.length === 0 ? (
                     <div className="h-[300px] w-full flex items-center justify-center border rounded-lg bg-muted/10">
                         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                     </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm bg-card border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-muted-foreground"/> Fluxo de Caixa 
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}}/>
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `${val/1000}k`} tick={{fill: '#9ca3af'}}/>
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)} 
                                            contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', color: 'hsl(var(--foreground))'}}
                                            cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}}
                                        />
                                        <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm bg-card border-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <PieIcon className="w-4 h-4 text-muted-foreground"/> Despesas por Categoria
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={1} stroke="hsl(var(--background))" />)}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', color: 'hsl(var(--foreground))'}}/>
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        Nenhuma despesa no período.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="statement" className="animate-in slide-in-from-bottom-2 duration-300">
                <Card className="shadow-sm bg-card border-border/50">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Extrato</CardTitle>
                            <Badge variant="outline" className="font-normal text-muted-foreground text-xs">
                                {entries.length} lançamentos
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading && entries.length === 0 ? (
                            <div className="space-y-2">
                                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : (
                            <div className="rounded-md border border-border/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-[100px]">Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-center w-[100px]">Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                                                    Nenhum lançamento encontrado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            entries.map(entry => (
                                                <TableRow key={entry.id} className="group hover:bg-muted/30 transition-colors">
                                                    <TableCell className="font-medium text-muted-foreground text-xs">
                                                        {format(new Date(entry.due_date), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleEditEntry(entry)}>
                                                            {entry.description}
                                                        </div>
                                                        {entry.installment_number && (
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                Parcela {entry.installment_number}/{entry.total_installments}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-normal text-[10px] bg-muted text-muted-foreground border-transparent">
                                                            {entry.expense_category || entry.income_category || 'Geral'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold text-sm ${entry.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                        {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={cn("text-[10px] px-2 py-0 h-5 font-semibold", entry.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 border-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 border-amber-200')}>
                                                            {entry.status === 'paid' ? 'Pago' : 'Pendente'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <ActionMenu 
                                                            type="financial"
                                                            status={entry.status}
                                                            onEdit={() => handleEditEntry(entry)}
                                                            onConfirm={() => openConfirmModal(entry)}
                                                            onUnconfirm={() => handleUnconfirmPayment(entry.id)}
                                                            onDelete={() => handleDeleteRequest(entry.id)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="projections" className="animate-in slide-in-from-bottom-2 duration-300">
                 <Card className="shadow-sm bg-card border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-amber-500"/> Evolução do Lucro Líquido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}}/>
                                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `${val/1000}k`} tick={{fill: '#9ca3af'}}/>
                                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px', color: 'hsl(var(--foreground))'}}/>
                                <Area type="monotone" dataKey="Lucro" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Modals */}
        <FinancialEntryModal 
            isOpen={isEntryModalOpen}
            onClose={() => setIsEntryModalOpen(false)}
            onSave={() => {
                setIsEntryModalOpen(false);
                fetchFinancials(); // Refresh data
            }}
            entry={entryToEdit}
            user={user}
        />

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <ConfirmPaymentModal 
            open={confirmModalOpen}
            onOpenChange={setConfirmModalOpen}
            entry={entryToConfirm}
            onConfirm={handleConfirmPayment}
            loading={confirmLoading}
        />
    </div>
  );
};

export default FinancialDashboard;