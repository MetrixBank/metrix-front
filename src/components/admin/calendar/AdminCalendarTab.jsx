import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAdminCalendarData } from '@/hooks/useAdminCalendarData';
import AdminCalendarSidebar from './AdminCalendarSidebar';
import AdminCalendarEventDetails from './AdminCalendarEventDetails';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
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

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), getDay, locales });

const AdminCalendarTab = () => {
    const isMobile = useMediaQuery('(max-width: 1024px)');
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filters, setFilters] = useState({
        searchQuery: '',
        distributorId: 'all',
        showFinancials: false
    });
    const [distributors, setDistributors] = useState([]);
    
    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Fetch distributors for filter
    useEffect(() => {
        const fetchDistributors = async () => {
            const { data } = await supabase.from('profiles').select('id, name').in('role', ['distributor', 'sub-admin']);
            setDistributors(data || []);
        };
        fetchDistributors();
    }, []);

    // Custom hook for data
    const { events, loading, refetch } = useAdminCalendarData({ from: addDays(date, -40), to: addDays(date, 40) }, filters);

    // Event Styles
    const eventPropGetter = (event) => {
        let backgroundColor = '#3b82f6'; // blue default
        let borderLeftColor = '#1d4ed8';

        if (event.type === 'financial') {
            if (event.subType === 'income') {
                backgroundColor = '#10b981'; // emerald
                borderLeftColor = '#047857';
            } else {
                backgroundColor = '#ef4444'; // red
                borderLeftColor = '#b91c1c';
            }
        } else if (event.type === 'activity') {
            switch (event.status) {
                case 'sale_made': backgroundColor = '#059669'; borderLeftColor = '#065f46'; break;
                case 'in_progress': backgroundColor = '#f59e0b'; borderLeftColor = '#b45309'; break;
                case 'cancelled': backgroundColor = '#64748b'; borderLeftColor = '#334155'; break;
                default: backgroundColor = '#3b82f6'; borderLeftColor = '#1d4ed8';
            }
        }

        return {
            style: {
                backgroundColor,
                borderLeft: `4px solid ${borderLeftColor}`,
                borderRadius: '4px',
                opacity: 0.9,
                color: '#fff',
                fontSize: '0.75rem',
                border: 'none',
                display: 'block'
            }
        };
    };

    const handleEventDeleteRequest = (event) => {
        setEventToDelete(event);
        setDeleteDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!eventToDelete) return;
        
        try {
            const table = eventToDelete.type === 'financial' ? 'horizons_financial_entries' : 'sales_opportunities';
            const { error } = await supabase.from(table).delete().eq('id', eventToDelete.id);
            if (error) throw error;
            
            toast({ title: "Sucesso", description: "Item excluído com sucesso." });
            setSelectedEvent(null);
            refetch();
        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao excluir item.", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        }
    };
    
    const handleEventEdit = (event) => {
        // Placeholder: Implement redirect to edit page or open edit modal
        toast({ title: "Em breve", description: "Edição rápida estará disponível em breve." });
    };

    const CustomToolbar = ({ label, onNavigate, onView }) => (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 p-2">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => onNavigate('PREV')}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-xl font-bold text-white min-w-[160px] text-center">{label}</h2>
                <Button variant="outline" size="icon" onClick={() => onNavigate('NEXT')}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('TODAY')}>Hoje</Button>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
                <Button 
                    variant={view === Views.MONTH ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onView(Views.MONTH)}
                    className="text-xs"
                >Mês</Button>
                <Button 
                    variant={view === Views.WEEK ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onView(Views.WEEK)}
                    className="text-xs"
                >Semana</Button>
                <Button 
                    variant={view === Views.DAY ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onView(Views.DAY)}
                    className="text-xs"
                >Dia</Button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Sidebar (Filters & Upcoming) - Collapsible on mobile or stacked */}
            <div className="w-full lg:w-80 flex-shrink-0">
                <AdminCalendarSidebar 
                    filters={filters}
                    onFilterChange={(k, v) => setFilters(prev => ({...prev, [k]: v}))}
                    upcomingEvents={events.filter(e => e.start >= new Date())}
                    distributors={distributors}
                />
            </div>

            {/* Main Calendar Area */}
            <Card className="flex-1 bg-slate-900/50 border-white/10 shadow-xl overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    </div>
                ) : (
                    <div className="flex-1 p-4 overflow-y-auto">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', minHeight: '500px' }}
                            views={[Views.MONTH, Views.WEEK, Views.DAY]}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            onSelectEvent={setSelectedEvent}
                            components={{ toolbar: CustomToolbar }}
                            eventPropGetter={eventPropGetter}
                            messages={{
                                next: "Próximo",
                                previous: "Anterior",
                                today: "Hoje",
                                month: "Mês",
                                week: "Semana",
                                day: "Dia"
                            }}
                            culture="pt-BR"
                            popup
                        />
                    </div>
                )}
            </Card>

            <AdminCalendarEventDetails 
                event={selectedEvent}
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onDelete={handleEventDeleteRequest}
                onEdit={handleEventEdit}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o item selecionado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCalendarTab;