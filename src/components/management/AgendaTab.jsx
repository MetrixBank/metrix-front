import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  ChevronRight, FilterX, Plus, TrendingUp, Loader2, ChevronLeft
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
         <Card className="flex-1 border-l-4 border-l-primary overflow-hidden hover:shadow-md transition-all group">
            <CardContent className="p-2.5 sm:p-4 flex items-center justify-between gap-2">
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
             <Card className={cn("flex-1 border-l-4 overflow-hidden hover:shadow-md transition-all", isIncome ? "border-l-emerald-500" : "border-l-red-500")}>
                <CardContent className="p-2.5 sm:p-4 flex items-center justify-between gap-2">
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
            <div className="bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] dark:from-violet-600 dark:to-purple-800 pt-6 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-8 rounded-b-[2.5rem] shadow-xl z-10 shrink-0 relative transition-colors duration-500">
                <div className="max-w-xl mx-auto mb-6 sm:mb-8">
                     <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/20 text-white h-10">
                            <TabsTrigger value="activities" className="data-[state=active]:bg-white data-[state=active]:text-violet-700 font-medium">Atividades</TabsTrigger>
                            <TabsTrigger value="financial" className="data-[state=active]:bg-white data-[state=active]:text-violet-700 font-medium">Financeiro</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="relative z-20 w-full max-w-md sm:max-w-5xl mx-auto">
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
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                            month: "space-y-4 sm:space-y-6 w-full",
                            caption: "flex justify-center pt-1 relative items-center text-lg sm:text-2xl font-bold text-white capitalize mb-4 sm:mb-8",
                            caption_label: "text-lg sm:text-2xl font-bold text-white capitalize",
                            nav: "space-x-1 sm:space-x-2 flex items-center absolute w-full justify-between top-0 px-2",
                            nav_button: "h-8 w-8 sm:h-12 sm:w-12 bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-full flex items-center justify-center transition-all opacity-90 hover:opacity-100",
                            nav_button_previous: "",
                            nav_button_next: "",
                            table: "w-full border-collapse space-y-0 sm:space-y-2",
                            head_row: "flex w-full justify-between mb-2 sm:mb-4 px-1",
                            head_cell: "text-white/80 rounded-md w-full font-medium text-xs sm:text-lg text-center uppercase tracking-wider",
                            row: "flex w-full mt-2 sm:mt-3 justify-between gap-1 sm:gap-3",
                            cell: "text-center p-0 relative focus-within:relative focus-within:z-20 w-full flex-1",
                            day: "h-9 w-9 sm:h-16 sm:w-16 mx-auto p-0 font-medium aria-selected:opacity-100 hover:bg-white/20 rounded-full transition-all text-white text-sm sm:text-xl flex items-center justify-center",
                            day_selected: "bg-white text-purple-700 hover:bg-white hover:text-purple-700 focus:bg-white focus:text-purple-700 font-bold shadow-lg scale-110",
                            day_today: "bg-white/20 text-white font-bold border-2 border-white/50",
                            day_outside: "text-white/30 opacity-50 aria-selected:bg-white/10 aria-selected:text-white/50 aria-selected:opacity-30",
                            day_disabled: "text-white/20 opacity-30",
                            day_range_middle: "aria-selected:bg-white/20 aria-selected:text-white",
                            day_hidden: "invisible",
                        }}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-6 pb-24 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    {selectedDate && <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}><FilterX className="w-4 h-4 mr-2"/> Ver Mês</Button>}
                </div>

                <div className="space-y-4">
                     {displayedEvents.length === 0 ? (
                         <div className="text-center py-10 opacity-50">
                             <p>Nenhum registro encontrado.</p>
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

            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                 <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-full shadow-xl bg-violet-600 hover:bg-violet-700 text-white pointer-events-auto transform transition-transform hover:scale-110 active:scale-95 ring-4 ring-background"
                    onClick={() => {
                        setSelectedEvent(null);
                        setIsEditModalOpen(true);
                    }}
                 >
                    <Plus className="h-8 w-8" />
                 </Button>
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