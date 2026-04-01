import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  ChevronRight, FilterX, Plus, TrendingUp, Loader2, ChevronLeft, CalendarX
} from 'lucide-react';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import { supabase } from '@/lib/supabaseClient';
import { cn, formatCurrency, getActivityTypePortuguese } from '@/lib/utils';
import { useDataSync } from '@/contexts/DataSyncContext';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/alert-dialog";
import { ConfirmPaymentModal } from '@/components/modals/ConfirmPaymentModal';

const AgendaTab = ({ user }) => {
    const [viewMode, setViewMode] = useState('activities'); // 'activities' | 'financial'
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState([]);
    const [financialEntries, setFinancialEntries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // UI States
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Deletion State
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'activity' | 'financial', id: uuid }

    // Confirmation State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [entryToConfirm, setEntryToConfirm] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const { syncKey, triggerSync } = useDataSync();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [oppsRes, finRes, custRes, prodRes] = await Promise.all([
                supabase.from('sales_opportunities')
                    .select('*, opportunity_products:opportunity_products!left(*, product:products(id, name))')
                    .eq('distributor_id', user.id)
                    .order('visit_time', { ascending: true }),
                supabase.from('horizons_financial_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('due_date', { ascending: true }),
                supabase.from('customers').select('*').eq('distributor_id', user.id),
                supabase.from('products').select('*').eq('distributor_id', user.id)
            ]);
            
            if (oppsRes.error) throw oppsRes.error;
            if (finRes.error) throw finRes.error;
            
            setOpportunities(oppsRes.data || []);
            setFinancialEntries(finRes.data || []);
            setCustomers(custRes.data || []);
            setProducts(prodRes.data || []);
        } catch (error) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);

    // --- Actions Handlers ---

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
                    p_opportunity_id: itemToDelete.id
                });
                if (error) throw error;
                toast({ title: "Atividade excluída", description: "A atividade e seus registros relacionados foram removidos." });
            } else if (itemToDelete.type === 'financial') {
                const { error } = await supabase
                    .from('horizons_financial_entries')
                    .delete()
                    .eq('id', itemToDelete.id);
                if (error) throw error;
                toast({ title: "Lançamento excluído", description: "O registro financeiro foi removido." });
            }
            triggerSync(); 
        } catch (error) {
            console.error("Delete error:", error);
            toast({ title: "Erro ao excluir", description: error.message || "Erro desconhecido.", variant: "destructive" });
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
                    due_date: paymentDate
                })
                .eq('id', entryId);

            if (error) throw error;
            
            toast({ 
                title: "Confirmado", 
                description: `Lançamento marcado como pago em ${format(new Date(paymentDate), 'dd/MM/yyyy')}.`,
                variant: "success"
            });
            triggerSync();
            setConfirmModalOpen(false);
            setEntryToConfirm(null);
        } catch (error) {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
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
            toast({ title: "Atualizado", description: "Lançamento marcado como pendente.", variant: "default" });
            triggerSync();
        } catch (error) {
             toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        }
    }


    // --- Data Filtering ---

    const displayedEvents = useMemo(() => {
        const sourceData = viewMode === 'activities' ? opportunities : financialEntries;
        
        let filtered;
        if (selectedDate && isValid(selectedDate)) {
            filtered = sourceData.filter(item => {
                const dateKey = viewMode === 'activities' ? item.visit_date : item.due_date;
                if (!dateKey) return false;
                const eventDate = parseISO(dateKey);
                return isValid(eventDate) && isSameDay(eventDate, selectedDate);
            });
        } else if (currentMonth && isValid(currentMonth)) {
            filtered = sourceData.filter(item => {
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
        sourceData.forEach(item => {
            const dateKey = viewMode === 'activities' ? item.visit_date : item.due_date;
            if (dateKey) days.add(dateKey.split('T')[0]);
        });
        return days;
    }, [opportunities, financialEntries, viewMode]);

    const modifiers = { hasEvent: (date) => daysWithEvents.has(format(date, 'yyyy-MM-dd')) };
    
    // --- Render Cards ---

    const renderActivityCard = (event) => (
         <Card className="flex-1 rounded-2xl border-l-4 border-l-primary overflow-hidden hover:shadow-md transition-all group">
            <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
                <div onClick={() => handleEditActivity(event)} className="flex-1 cursor-pointer min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate pr-1">{event.customer_name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground mt-0.5 sm:mt-1 gap-1 sm:gap-2 flex-wrap">
                        <span className="uppercase tracking-wide">{getActivityTypePortuguese(event.activity_type)}</span>
                        {event.status === 'sale_made' && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px] sm:text-[10px]">VENDA</span>}
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
             <Card className={cn("flex-1 rounded-2xl border-l-4 overflow-hidden hover:shadow-md transition-all", isIncome ? "border-l-emerald-500" : "border-l-red-500")}>
                <CardContent className="p-3 sm:p-5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate pr-1">{entry.description}</h3>
                        <div className="flex flex-col mt-0.5 sm:mt-1">
                             <span className={cn("font-bold text-base sm:text-lg", isIncome ? "text-emerald-600" : "text-red-600")}>
                                {isIncome ? '+' : '-'}{formatCurrency(entry.amount)}
                             </span>
                             {netProfitShare && (
                                 <span className="text-[10px] sm:text-xs text-emerald-600/70 font-medium flex items-center truncate">
                                     <TrendingUp className="w-3 h-3 mr-1 shrink-0"/> Lucro Líquido: {formatCurrency(netProfitShare)}
                                 </span>
                             )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        <span className={cn("px-1.5 py-0.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-bold uppercase whitespace-nowrap", entry.status === 'paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
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

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <div className="relative overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-purple-950/40 z-10 shrink-0 transition-colors duration-500">
                <div className="relative z-10 pt-6 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-8">
                <div className="max-w-3xl mx-auto w-full">
                    <div className="rounded-2xl p-px bg-gradient-to-br from-white/35 via-purple-500/40 to-transparent shadow-[0_20px_60px_rgba(138,43,226,0.15)]">
                    <div className="font-calendar rounded-[15px] bg-white/[0.06] backdrop-blur-[12px] sm:backdrop-blur-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-3 pt-4 pb-5 sm:px-5 sm:pt-5 sm:pb-6 space-y-5 sm:space-y-6">
                     <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-xl text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] bg-white/[0.06] backdrop-blur-sm border border-white/[0.14]">
                            <TabsTrigger value="activities" className="text-white/70 rounded-lg py-2.5 font-medium transition-all duration-300 ease-out data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:font-semibold data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.12)]">Atividades</TabsTrigger>
                            <TabsTrigger value="financial" className="text-white/70 rounded-lg py-2.5 font-medium transition-all duration-300 ease-out data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:font-semibold data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.12)]">Financeiro</TabsTrigger>
                        </TabsList>
                    </Tabs>
                <div className="relative z-20 w-full">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        onMonthChange={(m) => { setCurrentMonth(m); setSelectedDate(undefined); }}
                        month={currentMonth}
                        locale={ptBR}
                        modifiers={modifiers}
                        components={{ IconLeft: () => <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />, IconRight: () => <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" /> }}
                        classNames={{
                            months: "flex flex-col sm:flex-row justify-center space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                            month: "space-y-4 sm:space-y-6 w-full flex flex-col items-center",
                            caption: "flex justify-center pt-1 relative items-center w-full text-lg sm:text-2xl font-bold text-white capitalize mb-4 sm:mb-8 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] z-10",
                            caption_label: "text-lg sm:text-2xl font-bold text-white capitalize tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)] z-10",
                            nav: "flex items-center justify-between absolute w-full top-0 px-2 sm:px-4 z-20",
                            nav_button: "h-10 w-10 sm:h-12 sm:w-12 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-white rounded-full flex items-center justify-center transition-colors duration-200 bg-black/30 hover:bg-white/10 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/25 active:scale-95",
                            nav_button_previous: "",
                            nav_button_next: "",
                            table: "w-full max-w-md mx-auto border-collapse space-y-0 sm:space-y-2",
                            head_row: "flex w-full max-w-md mx-auto justify-between mb-2 sm:mb-4 px-0.5",
                            head_cell: "text-white/75 rounded-md w-full font-normal text-[10px] sm:text-xs text-center uppercase tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
                            row: "flex w-full max-w-md mx-auto mt-2 sm:mt-3 justify-between gap-2 sm:gap-3",
                            cell: "text-center p-0 relative focus-within:relative focus-within:z-20 w-full flex-1 flex justify-center",
                            day: "h-9 w-9 sm:h-16 sm:w-16 mx-auto p-0 font-semibold aria-selected:opacity-100 hover:bg-white/15 rounded-full transition-all text-white/95 text-sm sm:text-xl flex items-center justify-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
                            day_selected: "bg-white text-purple-950 hover:bg-white hover:text-purple-950 focus:bg-white focus:text-purple-950 font-bold scale-110 ring-2 ring-[rgba(138,43,226,0.45)] shadow-[0_0_24px_rgba(138,43,226,0.35),0_4px_14px_rgba(255,255,255,0.2)]",
                            day_today: "bg-white/18 text-white font-extrabold border-2 border-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                            day_outside: "text-white/42 font-medium opacity-80 aria-selected:bg-white aria-selected:text-purple-950 aria-selected:opacity-100 aria-selected:font-bold",
                            day_disabled: "text-white/28 opacity-40 font-medium",
                            day_range_middle: "aria-selected:bg-white/20 aria-selected:text-white",
                            day_hidden: "invisible",
                        }}
                    />
                </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-6 pb-24 sm:px-6">
                <div className="max-w-3xl mx-auto w-full">
                <div className="flex items-center justify-between mb-4 gap-3">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    {selectedDate && (
                        <button
                            type="button"
                            onClick={() => setSelectedDate(undefined)}
                            className="inline-flex items-center gap-2 shrink-0 px-3 py-1.5 text-sm bg-muted/30 hover:bg-muted/50 text-muted-foreground rounded-full transition-all"
                        >
                            <FilterX className="w-4 h-4" />
                            Ver Mês
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                     {displayedEvents.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-center">
                             <CalendarX className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/30 mb-4" aria-hidden />
                             <p className="text-base font-medium text-muted-foreground">Nenhum registro para este dia</p>
                             <p className="text-sm text-muted-foreground/80 mt-1 max-w-sm">
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
                                className="flex gap-2 sm:gap-4"
                             >
                                 <div className="w-8 sm:w-12 text-right pt-2 text-xs sm:text-sm font-bold text-muted-foreground shrink-0">
                                     {viewMode === 'activities' ? item.visit_time?.substring(0,5) : format(parseISO(item.due_date), 'dd')}
                                 </div>
                                 {viewMode === 'activities' ? renderActivityCard(item) : renderFinancialCard(item)}
                             </motion.div>
                         ))
                     )}
                </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto relative h-14 w-14 shrink-0 rounded-full shadow-2xl shadow-purple-950/40">
                    <span
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1e0a3c] via-[#4c1d95] to-[#0f0528] dark:from-[#0c0a1a] dark:via-violet-950 dark:to-[#0a0518]"
                        aria-hidden
                    />
                    <span
                        className="absolute inset-0 rounded-full bg-gradient-to-t from-black/40 via-black/5 to-transparent"
                        aria-hidden
                    />
                    <span
                        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_15%,rgba(167,139,250,0.5)_0%,rgba(91,33,182,0.2)_45%,transparent_65%)]"
                        aria-hidden
                    />
                    <span
                        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_100%_100%,rgba(124,58,237,0.35)_0%,transparent_50%)]"
                        aria-hidden
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative h-14 w-14 rounded-full border border-white/[0.24] bg-white/[0.08] text-white backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(255,255,255,0.06),0_6px_28px_rgba(76,29,149,0.4),0_0_24px_rgba(196,181,253,0.25)] hover:bg-white/[0.14] hover:text-white hover:border-white/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(76,29,149,0.5),0_0_32px_rgba(196,181,253,0.35)] transition-all hover:scale-110 active:scale-95 ring-4 ring-background"
                        onClick={() => {
                            setSelectedEvent(null);
                            setIsEditModalOpen(true);
                        }}
                    >
                        <Plus className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" strokeWidth={2.25} />
                    </Button>
                </div>
            </div>

            {isEditModalOpen && (
                <AddSalesActivityModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
                    user={user}
                    activityData={selectedEvent}
                    customers={customers}
                    products={products}
                    onActivityAdded={() => { triggerSync(); fetchData(); }}
                />
            )}

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente 
                            {itemToDelete?.type === 'activity' ? ' esta atividade e todos os dados financeiros e de estoque relacionados.' : ' este lançamento financeiro.'}
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

export default AgendaTab;