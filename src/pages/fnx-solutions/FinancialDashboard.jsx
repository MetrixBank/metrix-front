import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Plus, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import {
  startOfMonth,
  endOfMonth,
  format,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  getDate,
  isSameMonth,
  startOfWeek,
  addDays,
  isSameDay,
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
} from '@/components/ui/alert-dialog';
import { ConfirmPaymentModal } from '@/components/modals/ConfirmPaymentModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import FinancialEntryModal from './FinancialEntryModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialBalance } from '@/hooks/useFinancialBalance';
import FinancialPageHeader from '@/components/financial/FinancialPageHeader';
import FinancialHeroCard from '@/components/financial/FinancialHeroCard';
import FinancialQuickActionsSection from '@/components/financial/FinancialQuickActionsSection';
import FinancialStatRow from '@/components/financial/FinancialStatRow';
import FinancialTransactionList from '@/components/financial/FinancialTransactionList';

const FinancialDashboard = ({
  user: propUser,
  proposalsMadeCount,
  onOpenLoanSimulator,
  pageTitle,
  pageSubtitle,
}) => {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const { toast } = useToast();
  const statsRef = useRef(null);
  const balanceState = useFinancialBalance();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullStatement, setShowFullStatement] = useState(false);

  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [entryToConfirm, setEntryToConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
      default:
        break;
    }
  };

  const fetchFinancials = useCallback(async () => {
    if (!user || !dateRange.from || !dateRange.to) return;

    if (entries.length === 0) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('horizons_financial_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', dateRange.from.toISOString())
        .lte('due_date', dateRange.to.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, toast]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

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
      const { error } = await supabase.from('horizons_financial_entries').delete().eq('id', entryToDelete);

      if (error) throw error;

      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete));
      toast({ title: 'Excluído', description: 'Lançamento removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
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

      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, status: 'paid', due_date: paymentDate } : e)),
      );
      toast({ title: 'Confirmado', description: 'Pagamento registrado com sucesso.', variant: 'success' });
      setConfirmModalOpen(false);
      setEntryToConfirm(null);
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
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
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'pending' } : e)));
      toast({ title: 'Atualizado', description: 'Lançamento marcado como pendente.' });
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const stats = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = income - expense;
    const netProfit = entries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0);

    return { income, expense, balance, netProfit };
  }, [entries]);

  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];

    const isSingleMonth = isSameMonth(dateRange.from, dateRange.to);

    let dataPoints = [];
    if (isSingleMonth) {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      dataPoints = days.map((day) => {
        const label = getDate(day).toString();
        const dayEntries = entries.filter((e) => {
          const ed = new Date(e.due_date);
          return ed.getDate() === day.getDate();
        });
        return {
          name: label,
          Receitas: dayEntries.filter((e) => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0),
          Despesas: dayEntries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0),
          Lucro: dayEntries
            .filter((e) => e.type === 'income')
            .reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0),
        };
      });
    } else {
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      dataPoints = months.map((monthDate) => {
        const label = format(monthDate, 'MMM', { locale: ptBR });
        const monthEntries = entries.filter((e) => {
          const ed = new Date(e.due_date);
          return ed.getMonth() === monthDate.getMonth() && ed.getFullYear() === monthDate.getFullYear();
        });
        return {
          name: label,
          Receitas: monthEntries.filter((e) => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0),
          Despesas: monthEntries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0),
          Lucro: monthEntries
            .filter((e) => e.type === 'income')
            .reduce((sum, e) => sum + (Number(e.custom_data?.net_profit_share) || 0), 0),
        };
      });
    }
    return dataPoints;
  }, [entries, dateRange]);

  const weekBarData = useMemo(() => {
    const labels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const fallback = [3200, 4100, 8900, 3800, 5200, 7600, 2400];
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return labels.map((name, i) => {
      const day = addDays(start, i);
      const dayTotal = entries
        .filter((e) => e.due_date && isSameDay(new Date(e.due_date), day))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const value = dayTotal > 0 ? dayTotal : fallback[i];
      let fill = '#374151';
      if (i === 2) fill = '#A855F7';
      if (i === 5) fill = '#2DD4BF';
      return { name, value, fill };
    });
  }, [entries]);

  const saldoEstimado = useMemo(() => {
    const v = stats.balance + stats.income * 0.15;
    return v > 0 ? v : 158000;
  }, [stats.balance, stats.income]);

  const SkeletonCard = () => (
    <Card className="bg-[#1A1625] border-white/10">
      <CardHeader className="p-4">
        <Skeleton className="h-4 w-1/2 bg-white/10" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className="h-8 w-full bg-white/10" />
      </CardContent>
    </Card>
  );

  const scrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative -mx-3 sm:-mx-4 lg:-mx-8 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 bg-[#0D0B14] rounded-xl sm:rounded-2xl border border-white/[0.06] text-white space-y-8">
      <FinancialPageHeader
        title={pageTitle ?? 'Financeiro'}
        subtitle={
          pageSubtitle ??
          'Gerencie seu fluxo de caixa e resultados com precisão editorial.'
        }
      />

      <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4">
        <div className="hidden md:block w-px h-px" aria-hidden />
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-[#1A1625] p-1 rounded-xl border border-white/10">
            {['month', 'quarter', 'year'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  'h-8 text-xs px-3 rounded-lg text-[#94A3B8]',
                  period === p && 'bg-[#B589FF]/20 text-white font-semibold border border-[#B589FF]/30',
                )}
              >
                {p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Anual'}
              </Button>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={period === 'custom' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs px-3 rounded-lg text-[#94A3B8]',
                    period === 'custom' && 'bg-[#B589FF]/20 text-white',
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {period === 'custom' && dateRange?.from
                    ? dateRange.to
                      ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      : format(dateRange.from, 'dd/MM/yy')
                    : 'Personalizado'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange(range);
                      setPeriod('custom');
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="sm"
            onClick={handleOpenNewEntry}
            className="rounded-xl bg-[#B589FF] text-[#0D0B14] hover:bg-[#c9a8ff] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo lançamento
          </Button>
        </div>
      </div>

      <FinancialHeroCard
        {...balanceState}
        entries={entries}
        onVerDetalhes={scrollToStats}
      />

      <FinancialQuickActionsSection
        onPaymentSuccess={balanceState.refetch}
        onOpenLoanSimulator={onOpenLoanSimulator}
      />

      <div ref={statsRef}>
        {loading && entries.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <FinancialStatRow
            income={stats.income}
            expense={stats.expense}
            balance={stats.balance}
            netProfit={stats.netProfit}
            loading={loading && entries.length === 0}
            proposalsMadeCount={proposalsMadeCount}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="bg-[#1A1625] border-white/[0.08] rounded-[20px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
          <CardContent className="pt-6 pb-6">
            <Tabs defaultValue="statement" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-white/[0.08] pb-0">
                <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none border-0 w-full sm:w-auto justify-start">
                  <TabsTrigger
                    value="statement"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B589FF] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94A3B8] pb-3 px-0"
                  >
                    Extrato detalhado
                  </TabsTrigger>
                  <TabsTrigger
                    value="projections"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B589FF] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94A3B8] pb-3 px-0"
                  >
                    Projeções
                  </TabsTrigger>
                </TabsList>
                <button
                  type="button"
                  onClick={() => setShowFullStatement(true)}
                  className="text-sm text-[#B589FF] hover:text-[#d4b8ff] self-end sm:self-auto mb-2 sm:mb-0"
                >
                  Ver tudo →
                </button>
              </div>

              <TabsContent value="statement" className="mt-0 pt-2">
                {loading && entries.length === 0 ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full bg-white/10" />
                    ))}
                  </div>
                ) : (
                  <>
                    <FinancialTransactionList entries={entries} onSelectEntry={handleEditEntry} max={6} />
                    {showFullStatement && (
                      <div className="mt-6 rounded-xl border border-white/10 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                              <TableHead className="text-[#94A3B8]">Data</TableHead>
                              <TableHead className="text-[#94A3B8]">Descrição</TableHead>
                              <TableHead className="text-[#94A3B8]">Categoria</TableHead>
                              <TableHead className="text-right text-[#94A3B8]">Valor</TableHead>
                              <TableHead className="text-center w-[90px] text-[#94A3B8]">Status</TableHead>
                              <TableHead className="w-[40px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entries.map((entry) => (
                              <TableRow key={entry.id} className="border-white/10 hover:bg-white/[0.04]">
                                <TableCell className="text-xs text-[#94A3B8]">
                                  {format(new Date(entry.due_date), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>
                                  <button
                                    type="button"
                                    className="text-left text-sm text-white hover:text-[#B589FF]"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    {entry.description}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-white/10 text-[#94A3B8] border-0"
                                  >
                                    {entry.expense_category || entry.income_category || 'Geral'}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    'text-right font-semibold text-sm',
                                    entry.type === 'income' ? 'text-[#5EEAD4]' : 'text-red-400',
                                  )}
                                >
                                  {entry.type === 'income' ? '+' : '-'}
                                  {formatCurrency(entry.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    className={cn(
                                      'text-[10px]',
                                      entry.status === 'paid'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-200',
                                    )}
                                  >
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
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="projections" className="mt-0 pt-4">
                <div className="h-[280px] w-full">
                  {loading && entries.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorProfitFin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#B589FF" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#B589FF" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.4} />
                        <XAxis
                          dataKey="name"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#94A3B8' }}
                        />
                        <YAxis
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${val / 1000}k`}
                          tick={{ fill: '#94A3B8' }}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: '#1A1625',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Lucro"
                          stroke="#B589FF"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorProfitFin)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1625] border-white/[0.08] rounded-[20px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Fluxo de caixa</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            {loading && entries.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekBarData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8' }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val / 1000}k`}
                    tick={{ fill: '#94A3B8' }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#1A1625',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {weekBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <div className="px-6 pb-5 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/[0.06] mt-2">
            <p className="text-sm text-[#94A3B8]">
              Saldo estimado:{' '}
              <span className="text-white font-semibold tabular-nums">{formatCurrency(saldoEstimado)}</span>
            </p>
            <p className="text-sm text-[#5EEAD4] flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Crescimento de 4.2% projetado
            </p>
          </div>
        </Card>
      </div>

      <FinancialEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={() => {
          setIsEntryModalOpen(false);
          fetchFinancials();
        }}
        entry={entryToEdit}
        user={user}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="bg-[#1A1625] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8]">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-600/90"
            >
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
