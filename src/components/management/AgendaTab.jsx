import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DayPicker,
    CaptionLabel,
    CaptionNavigation,
    DayContent,
    useDayPicker,
} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
    ChevronRight,
    FilterX,
    Loader2,
    ChevronLeft,
    CalendarX,
    Zap,
    TrendingUp,
} from 'lucide-react';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import { supabase } from '@/lib/supabaseClient';
import { cn, formatCurrency, getActivityTypePortuguese } from '@/lib/utils';
import { useDataSync } from '@/contexts/DataSyncContext';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionMenu } from '@/components/ui/ActionMenu';
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

/** Primeira letra maiúscula (ex.: «abril 2026» → «Abril 2026»). */
function capitalizeSentencePt(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/** «09 de abril» → «09 de Abril» */
function formatDayMonthTitle(date) {
    const raw = format(date, "dd 'de' MMMM", { locale: ptBR });
    const de = ' de ';
    const i = raw.indexOf(de);
    if (i === -1) return capitalizeSentencePt(raw);
    return raw.slice(0, i + de.length) + capitalizeSentencePt(raw.slice(i + de.length));
}

function AgendaCaption(props) {
    const { classNames, styles } = useDayPicker();
    return (
        <div className={cn(classNames.caption, 'relative flex w-full flex-col items-stretch pt-1')} style={styles?.caption}>
            {/* pointer-events-none evita que esta camada roube cliques das setas (nav fica por baixo no eixo Z). */}
            <div className="pointer-events-none relative z-10 mb-2 flex flex-wrap items-center justify-center gap-2 px-10 sm:gap-3 sm:px-14">
                <CaptionLabel
                    id={props.id}
                    displayMonth={props.displayMonth}
                    displayIndex={props.displayIndex}
                />
            </div>
            <CaptionNavigation
                displayMonth={props.displayMonth}
                id={props.id}
                displayIndex={props.displayIndex}
            />
        </div>
    );
}

function AgendaDayContent(props) {
    const {
        locale,
        formatters: { formatDay },
    } = useDayPicker();
    const hasSpark = Boolean(props.activeModifiers?.hasEvent);
    const isSelected = Boolean(props.activeModifiers?.selected);
    return (
        <span className="flex flex-col items-center justify-center gap-0.5">
            <span
                className={cn(
                    'font-calendar font-medium leading-none',
                    isSelected && 'font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                )}
            >
                {formatDay(props.date, { locale })}
            </span>
            <span
                className={cn(
                    'h-1 w-1 shrink-0 rounded-full transition-opacity',
                    hasSpark
                        ? 'bg-[#a0fff0] opacity-100 shadow-[0_0_6px_rgba(160,255,240,0.85)]'
                        : 'opacity-0'
                )}
                aria-hidden
            />
        </span>
    );
}

const AgendaTab = ({ user }) => {
    const [viewMode, setViewMode] = useState('activities'); // 'activities' | 'financial'
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [entryToConfirm, setEntryToConfirm] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const { syncKey, triggerSync } = useDataSync();

    const agendaFormatters = useMemo(
        () => ({
            formatCaption: (month) => {
                const s = format(month, 'LLLL yyyy', { locale: ptBR });
                return s.charAt(0).toUpperCase() + s.slice(1);
            },
        }),
        []
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [oppsRes, finRes, custRes, prodRes] = await Promise.all([
                supabase
                    .from('sales_opportunities')
                    .select(
                        '*, opportunity_products:opportunity_products!left(*, product:products(id, name))'
                    )
                    .eq('distributor_id', user.id)
                    .order('visit_time', { ascending: true }),
                supabase
                    .from('horizons_financial_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('due_date', { ascending: true }),
                supabase.from('customers').select('*').eq('distributor_id', user.id),
                supabase.from('products').select('*').eq('distributor_id', user.id),
            ]);

            if (oppsRes.error) throw oppsRes.error;
            if (finRes.error) throw finRes.error;

            setOpportunities(oppsRes.data || []);
            setFinancialEntries(finRes.data || []);
            setCustomers(custRes.data || []);
            setProducts(prodRes.data || []);
        } catch (error) {
            toast({
                title: 'Erro ao carregar dados',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);

    const handleEditActivity = (activity) => {
        setSelectedEvent(activity);
        setIsEditModalOpen(true);
    };

    const handleDeleteActivityRequest = (activityId) => {
        setItemToDelete({ type: 'activity', id: activityId });
        setDeleteAlertOpen(true);
    };

    const handleDeleteFinancialRequest = (entryId) => {
        setItemToDelete({ type: 'financial', id: entryId });
        setDeleteAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'activity') {
                const { error } = await supabase.rpc('delete_opportunity_and_related_tasks', {
                    p_opportunity_id: itemToDelete.id,
                });
                if (error) throw error;
                toast({
                    title: 'Atividade excluída',
                    description: 'A atividade e seus registros relacionados foram removidos.',
                });
            } else if (itemToDelete.type === 'financial') {
                const { error } = await supabase
                    .from('horizons_financial_entries')
                    .delete()
                    .eq('id', itemToDelete.id);
                if (error) throw error;
                toast({
                    title: 'Lançamento excluído',
                    description: 'O registro financeiro foi removido.',
                });
            }
            triggerSync();
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Erro ao excluir',
                description: error.message || 'Erro desconhecido.',
                variant: 'destructive',
            });
        } finally {
            setDeleteAlertOpen(false);
            setItemToDelete(null);
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
                .update({
                    status: 'paid',
                    updated_at: new Date(),
                    due_date: paymentDate,
                })
                .eq('id', entryId);

            if (error) throw error;

            toast({
                title: 'Confirmado',
                description: `Lançamento marcado como pago em ${format(new Date(paymentDate), 'dd/MM/yyyy')}.`,
                variant: 'success',
            });
            triggerSync();
            setConfirmModalOpen(false);
            setEntryToConfirm(null);
        } catch (error) {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleUnconfirmPayment = async (entryId) => {
        try {
            const { error } = await supabase
                .from('horizons_financial_entries')
                .update({ status: 'pending', updated_at: new Date() })
                .eq('id', entryId);

            if (error) throw error;
            toast({ title: 'Atualizado', description: 'Lançamento marcado como pendente.', variant: 'default' });
            triggerSync();
        } catch (error) {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        }
    };

    const displayedEvents = useMemo(() => {
        const sourceData = viewMode === 'activities' ? opportunities : financialEntries;

        let filtered;
        if (selectedDate && isValid(selectedDate)) {
            filtered = sourceData.filter((item) => {
                const dateKey = viewMode === 'activities' ? item.visit_date : item.due_date;
                if (!dateKey) return false;
                const eventDate = parseISO(dateKey);
                return isValid(eventDate) && isSameDay(eventDate, selectedDate);
            });
        } else if (currentMonth && isValid(currentMonth)) {
            filtered = sourceData.filter((item) => {
                const dateKey = viewMode === 'activities' ? item.visit_date : item.due_date;
                if (!dateKey) return false;
                const eventDate = parseISO(dateKey);
                return isValid(eventDate) && isSameMonth(eventDate, currentMonth);
            });
        } else {
            return [];
        }

        return filtered.sort((a, b) => {
            const dateKeyA = viewMode === 'activities' ? a.visit_date : a.due_date;
            const dateKeyB = viewMode === 'activities' ? b.visit_date : b.due_date;
            return new Date(dateKeyA) - new Date(dateKeyB);
        });
    }, [opportunities, financialEntries, selectedDate, currentMonth, viewMode]);

    const daysWithEvents = useMemo(() => {
        const days = new Set();
        const sourceData = viewMode === 'activities' ? opportunities : financialEntries;
        sourceData.forEach((item) => {
            const dateKey = viewMode === 'activities' ? item.visit_date : item.due_date;
            if (dateKey) days.add(dateKey.split('T')[0]);
        });
        return days;
    }, [opportunities, financialEntries, viewMode]);

    const modifiers = { hasEvent: (date) => daysWithEvents.has(format(date, 'yyyy-MM-dd')) };

    const openNewActivity = () => {
        setSelectedEvent(null);
        setIsEditModalOpen(true);
    };

    const renderActivityCard = (event) => (
        <Card className="group flex-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/15">
            <CardContent className="flex items-center justify-between gap-2 p-3 sm:p-5">
                <div onClick={() => handleEditActivity(event)} className="min-w-0 flex-1 cursor-pointer">
                    <h3 className="truncate pr-1 font-semibold text-sm text-[#eae1fd] sm:text-base">
                        {event.customer_name}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[#aea7c1] sm:mt-1 sm:gap-2">
                        <span className="uppercase tracking-wide">
                            {getActivityTypePortuguese(event.activity_type)}
                        </span>
                        {event.status === 'sale_made' && (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 sm:text-[10px]">
                                VENDA
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <ActionMenu
                        type="activity"
                        onEdit={() => handleEditActivity(event)}
                        onDelete={() => handleDeleteActivityRequest(event.id)}
                    />
                </div>
            </CardContent>
        </Card>
    );

    const renderFinancialCard = (entry) => {
        const isIncome = entry.type === 'income';
        const netProfitShare = entry.custom_data?.net_profit_share;
        return (
            <Card
                className={cn(
                    'group flex-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/15',
                    isIncome ? 'border-l-[#34d399]/35' : 'border-l-rose-500/35'
                )}
            >
                <CardContent className="flex items-center justify-between gap-2 p-3 sm:p-5">
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate pr-1 font-semibold text-sm text-[#eae1fd] sm:text-base">
                            {entry.description}
                        </h3>
                        <div className="mt-0.5 flex flex-col sm:mt-1">
                            <span
                                className={cn(
                                    'text-base font-bold sm:text-lg',
                                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                                )}
                            >
                                {isIncome ? '+' : '-'}
                                {formatCurrency(entry.amount)}
                            </span>
                            {netProfitShare && (
                                <span className="flex items-center truncate text-[10px] font-medium text-emerald-400/80 sm:text-xs">
                                    <TrendingUp className="mr-1 h-3 w-3 shrink-0" /> Lucro Líquido:{' '}
                                    {formatCurrency(netProfitShare)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        <span
                            className={cn(
                                'whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase sm:px-2 sm:text-[10px]',
                                entry.status === 'paid'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-200'
                            )}
                        >
                            {entry.status === 'paid' ? 'Pago' : 'Pend.'}
                        </span>
                        <ActionMenu
                            type="financial"
                            status={entry.status}
                            onConfirm={() => openConfirmModal(entry)}
                            onUnconfirm={() => handleUnconfirmPayment(entry.id)}
                            onDelete={() => handleDeleteFinancialRequest(entry.id)}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-transparent">
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-3 pb-24 pt-4 sm:px-6 sm:pb-24 sm:pt-6 lg:flex-row lg:gap-6 lg:px-8 lg:pb-10">
                {/* Calendário */}
                <div
                    className={cn(
                        'agenda-nocturnal-surface font-calendar flex min-h-0 w-full flex-col rounded-2xl p-3 sm:p-5',
                        'lg:min-h-[min(520px,70vh)] lg:flex-1'
                    )}
                >
                    <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                            <TabsTrigger
                                value="activities"
                                className="rounded-lg py-2.5 font-medium text-[#aea7c1] transition-all data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#eae1fd] data-[state=active]:shadow-none"
                            >
                                Atividades
                            </TabsTrigger>
                            <TabsTrigger
                                value="financial"
                                className="rounded-lg py-2.5 font-medium text-[#aea7c1] transition-all data-[state=active]:bg-white/[0.08] data-[state=active]:text-[#eae1fd] data-[state=active]:shadow-none"
                            >
                                Financeiro
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative w-full flex-1">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            onMonthChange={(m) => {
                                setCurrentMonth(m);
                                setSelectedDate(undefined);
                            }}
                            month={currentMonth}
                            locale={ptBR}
                            formatters={agendaFormatters}
                            modifiers={modifiers}
                            components={{
                                Caption: AgendaCaption,
                                IconLeft: () => (
                                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                                ),
                                IconRight: () => (
                                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                                ),
                                DayContent: AgendaDayContent,
                            }}
                            classNames={{
                                root: 'w-full',
                                months: 'flex w-full flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0',
                                month: 'flex w-full flex-col items-center space-y-4 sm:space-y-6',
                                caption:
                                    'relative mb-4 flex w-full flex-col items-stretch pt-1 sm:mb-8 min-h-[3.25rem]',
                                caption_label:
                                    'text-center font-calendar text-lg font-bold tracking-tight text-[#eae1fd] sm:text-2xl',
                                nav: 'absolute inset-x-0 top-0 z-[35] flex w-full items-center justify-between px-1 sm:px-2 pointer-events-none',
                                nav_button:
                                    'pointer-events-auto flex h-10 w-10 min-h-[44px] min-w-[44px] sm:h-11 sm:w-11 items-center justify-center rounded-full border border-transparent bg-transparent text-[#eae1fd] shadow-none transition-all hover:text-[#c799ff] hover:drop-shadow-[0_0_10px_rgba(199,153,255,0.55)] active:scale-95 sm:min-h-0 sm:min-w-0',
                                nav_button_previous: '',
                                nav_button_next: '',
                                table: 'w-full border-collapse',
                                head_row:
                                    'mb-2 flex w-full justify-between px-0.5 sm:mb-4',
                                head_cell:
                                    'w-full flex-1 text-center font-calendar text-[10px] font-normal uppercase tracking-[0.15em] text-[#aea7c1]',
                                row: 'mt-2 flex w-full justify-between gap-1 sm:mt-3 sm:gap-2',
                                cell: 'relative flex w-full flex-1 justify-center p-0 text-center focus-within:relative focus-within:z-20',
                                day: 'font-calendar flex h-10 w-10 sm:h-14 sm:w-14 min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-0 text-sm font-medium text-white/90 transition-all hover:bg-white/10 sm:min-h-0 sm:min-w-0 sm:text-lg',
                                day_selected:
                                    'scale-105 bg-gradient-to-br from-[#b794f6] via-[#9d6ef2] to-[#7c4ddb] font-bold text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.25),0_4px_14px_rgba(124,77,219,0.45)] ring-2 ring-white/25 hover:from-[#c4a3f7] hover:via-[#a87ff5] hover:to-[#8b5cf6] hover:text-white focus:from-[#b794f6] focus:via-[#9d6ef2] focus:to-[#7c4ddb] focus:text-white',
                                day_today:
                                    'border-2 border-white/35 bg-white/10 font-semibold text-[#eae1fd]',
                                day_outside:
                                    'text-[#aea7c1]/50 opacity-90 aria-selected:opacity-100',
                                day_disabled: 'text-white/25 opacity-40',
                                day_range_middle: 'aria-selected:bg-white/15 aria-selected:text-white',
                                day_hidden: 'invisible',
                            }}
                        />
                    </div>
                </div>

                {/* Resumo diário / mensal */}
                <div
                    className={cn(
                        'agenda-nocturnal-surface flex min-h-[280px] w-full min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:min-h-[320px] sm:p-5',
                        'lg:max-h-[min(85vh,calc(100vh-8rem))] lg:w-[min(100%,400px)] lg:flex-shrink-0 lg:self-stretch'
                    )}
                >
                    <div className="mb-4 flex shrink-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] shadow-inner">
                            <Zap className="h-5 w-5 text-[#0f0b1e]" strokeWidth={2.25} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-calendar text-xs font-medium uppercase tracking-[0.12em] text-[#aea7c1]">
                                {selectedDate ? 'Resumo do dia' : 'Resumo do mês'}
                            </p>
                            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                                <h2 className="min-w-0 font-calendar text-xl font-bold leading-snug tracking-tight text-[#eae1fd]">
                                    {selectedDate
                                        ? formatDayMonthTitle(selectedDate)
                                        : capitalizeSentencePt(
                                              format(currentMonth, 'MMMM yyyy', { locale: ptBR })
                                          )}
                                </h2>
                                {selectedDate && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDate(undefined)}
                                        className="inline-flex w-fit shrink-0 items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#aea7c1] transition-colors hover:border-white/20 hover:text-[#eae1fd] sm:self-center"
                                    >
                                        <FilterX className="h-3.5 w-3.5" />
                                        Ver mês
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                        <div
                            className="agenda-timeline-rail pointer-events-none absolute bottom-2 left-[1.125rem] top-2 w-[2px] rounded-full sm:left-[1.375rem]"
                            aria-hidden
                        />
                        <div className="space-y-4 pl-8 sm:pl-10">
                            {displayedEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center px-1 py-8 text-center sm:py-12">
                                    <CalendarX
                                        className="mb-4 h-14 w-14 shrink-0 text-[#aea7c1]/35 sm:h-16 sm:w-16"
                                        aria-hidden
                                    />
                                    <p className="max-w-[20rem] font-medium leading-snug text-[#aea7c1]">
                                        {selectedDate
                                            ? 'Nenhum registro para este dia'
                                            : 'Nenhum registro neste mês'}
                                    </p>
                                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#aea7c1]/85">
                                        {viewMode === 'financial'
                                            ? 'Aproveite para registrar um novo lançamento.'
                                            : 'Aproveite para adicionar uma nova atividade.'}
                                    </p>
                                </div>
                            ) : (
                                displayedEvents.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="relative flex gap-2 sm:gap-4"
                                    >
                                        <div className="w-9 shrink-0 text-right font-calendar text-xs font-semibold text-[#aea7c1] sm:w-11 sm:text-sm">
                                            <span className="relative z-10 inline-block pt-1.5">
                                                {viewMode === 'activities'
                                                    ? item.visit_time?.substring(0, 5)
                                                    : format(parseISO(item.due_date), 'dd')}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            {viewMode === 'activities'
                                                ? renderActivityCard(item)
                                                : renderFinancialCard(item)}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={openNewActivity}
                        className={cn(
                            'agenda-cta-button font-calendar mt-5 h-12 w-full max-w-full shrink-0 rounded-xl border-0 px-4 font-bold tracking-wide text-[#0f0b1e]',
                            'bg-[linear-gradient(135deg,#c799ff_0%,#bc87fe_100%)]',
                            'hover:bg-[linear-gradient(135deg,#c799ff_0%,#bc87fe_100%)]',
                            'shadow-[0_0_28px_rgba(199,153,255,0.35)]',
                            'focus-visible:ring-2 focus-visible:ring-[#e8d4ff]/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151025]',
                            'lg:mt-6'
                        )}
                    >
                        <span className="relative z-[1]">Novo Registro</span>
                    </Button>
                </div>
            </div>

            {isEditModalOpen && (
                <AddSalesActivityModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedEvent(null);
                    }}
                    user={user}
                    activityData={selectedEvent}
                    customers={customers}
                    products={products}
                    onActivityAdded={() => {
                        triggerSync();
                        fetchData();
                    }}
                />
            )}

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente
                            {itemToDelete?.type === 'activity'
                                ? ' esta atividade e todos os dados financeiros e de estoque relacionados.'
                                : ' este lançamento financeiro.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export default AgendaTab;
