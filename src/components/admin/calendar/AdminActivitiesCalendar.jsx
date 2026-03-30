import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { CalendarDays, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import useMediaQuery from '@/hooks/useMediaQuery';
import { cn, getStatusPortuguese } from '@/lib/utils';
import ActivityDetailsModal from '@/components/admin/activities/ActivityDetailsModal';
import { useDataSync } from '@/contexts/DataSyncContext';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), getDay, locales });

const getStatusStyle = (status) => {
    switch (status) {
        case 'sale_made': return { bgColor: 'bg-emerald-500', textColor: 'text-emerald-50', borderColor: 'border-emerald-700' };
        case 'completed_no_sale': return { bgColor: 'bg-sky-500', textColor: 'text-sky-50', borderColor: 'border-sky-700' };
        case 'scheduled': return { bgColor: 'bg-amber-500', textColor: 'text-amber-900', borderColor: 'border-amber-700' };
        case 'in_progress': return { bgColor: 'bg-orange-500', textColor: 'text-orange-50', borderColor: 'border-orange-700' };
        case 'postponed': return { bgColor: 'bg-purple-500', textColor: 'text-purple-50', borderColor: 'border-purple-700' };
        case 'cancelled': return { bgColor: 'bg-red-500', textColor: 'text-red-50', borderColor: 'border-red-700' };
        default: return { bgColor: 'bg-slate-500', textColor: 'text-slate-50', borderColor: 'border-slate-700' };
    }
};

const CustomToolbar = ({ label, onNavigate, onView, view, isMobile }) => (
    <div className={cn("rbc-toolbar p-2 mb-3 bg-card/50 rounded-lg shadow-sm border border-border/30 flex items-center gap-2", isMobile ? "flex-col" : "flex-wrap justify-between")}>
        <div className={cn("flex items-center gap-1", isMobile ? "w-full justify-start mb-2" : "")}>
            <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')} className="text-xs px-2 h-8">Hoje</Button>
            <Button variant="ghost" size="icon" onClick={() => onNavigate('PREV')} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onNavigate('NEXT')} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex-grow text-center font-semibold text-gradient capitalize">{label}</div>
        <div className={cn("flex items-center gap-1", isMobile ? "w-full justify-around" : "")}>
            <Button variant={view === Views.MONTH ? "secondary" : "ghost"} size="sm" onClick={() => onView(Views.MONTH)} className="text-xs px-2 h-8">Mês</Button>
            <Button variant={view === Views.WEEK ? "secondary" : "ghost"} size="sm" onClick={() => onView(Views.WEEK)} className="text-xs px-2 h-8">Semana</Button>
            <Button variant={view === Views.DAY ? "secondary" : "ghost"} size="sm" onClick={() => onView(Views.DAY)} className="text-xs px-2 h-8">Dia</Button>
        </div>
    </div>
);

const AdminActivitiesCalendar = ({ distributorType }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { syncKey } = useDataSync();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('sales_opportunities')
                .select('*, distributor:profiles!inner(id, name, email, distributor_type)');

            if (distributorType) {
                query = query.eq('distributor.distributor_type', distributorType);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            setActivities(data || []);
        } catch (error) {
            toast({ title: "Erro ao buscar agenda", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [distributorType]);

    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);

    useEffect(() => {
        setCurrentView(isMobile ? 'day' : 'month');
    }, [isMobile]);

    const events = useMemo(() => activities.map(op => {
        const startDate = new Date(op.visit_date + 'T' + (op.visit_time || '00:00:00'));
        return {
            id: op.id,
            title: `(${op.distributor.name}) ${op.customer_name}`,
            start: startDate,
            end: addHours(startDate, 1),
            allDay: !op.visit_time,
            resource: op,
            status: op.status,
        };
    }), [activities]);

    const EventComponent = ({ event }) => {
        const { bgColor, textColor } = getStatusStyle(event.status);
        const titleText = isMobile ? event.title.split(') ')[1] || event.title : event.title;
        return (
            <div className={cn('p-1 rounded-md text-xs truncate flex items-center h-full', bgColor, textColor)}>
                <span className="truncate">{titleText}</span>
            </div>
        );
    };
    
    const messages = { allDay: 'Dia todo', previous: '<', next: '>', today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Lista', date: 'Data', time: 'Hora', event: 'Evento', noEventsInRange: 'Não há atividades neste período.', showMore: total => `+${total}` };

    return (
        <Card className="card-gradient backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center text-xl text-gradient">
                    <CalendarDays className="w-6 h-6 mr-2 text-primary" />
                    Agenda - {distributorType === 'team' ? 'Equipe Interna' : 'Distribuidores Externos'}
                </CardTitle>
            </CardHeader>
            <CardContent className={cn("p-1 sm:p-2 md:p-4", isMobile ? "h-[calc(100vh-200px)]" : "h-[700px]")}>
                {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
                ) : activities.length > 0 ? (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        messages={messages}
                        culture="pt-BR"
                        date={currentDate}
                        view={currentView}
                        onNavigate={setCurrentDate}
                        onView={setCurrentView}
                        onSelectEvent={(event) => setSelectedActivity(event.resource)}
                        popup={!isMobile}
                        components={{ toolbar: (props) => <CustomToolbar {...props} isMobile={isMobile} />, event: EventComponent }}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        eventPropGetter={(event) => ({ className: cn(getStatusStyle(event.status).bgColor, 'border-l-2 sm:border-l-4', getStatusStyle(event.status).borderColor, isMobile ? 'py-0.5 px-1' : 'py-1 px-1.5'), style: { borderRadius: '3px', fontSize: isMobile ? '0.65rem' : '0.78rem', cursor: 'pointer', opacity: 0.9 } })}
                        dayPropGetter={(date) => ({ className: events.some(event => startOfDay(event.start).getTime() === startOfDay(date).getTime()) ? 'bg-primary/5 hover:bg-primary/10' : 'bg-muted/5' })}
                        slotPropGetter={() => ({ className: 'hover:bg-muted/10' })}
                        className={cn("text-foreground [&_.rbc-header]:text-primary/80 [&_.rbc-header]:border-border/50 [&_.rbc-off-range-bg]:bg-muted/10 [&_.rbc-today]:bg-accent/10 [&_.rbc-event:focus]:outline-none [&_.rbc-event:focus]:ring-1 [&_.rbc-event:focus]:ring-ring [&_.rbc-event.rbc-selected]:bg-ring/80 [&_.rbc-event.rbc-selected]:shadow-lg", isMobile ? "[&_.rbc-header]:text-xs [&_.rbc-header]:p-1 [&_.rbc-time-gutter]:text-[0.6rem] [&_.rbc-time-slot]:text-[0.6rem] [&_.rbc-day-slot_.rbc-event]:min-h-[18px]" : "")}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
                        <p className="text-lg">Nenhuma atividade encontrada para {distributorType === 'team' ? 'a equipe interna' : 'distribuidores externos'}.</p>
                    </div>
                )}
            </CardContent>
            {selectedActivity && (
                <ActivityDetailsModal
                    activity={selectedActivity}
                    isOpen={!!selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                />
            )}
        </Card>
    );
};

export default AdminActivitiesCalendar;