import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';
import useMediaQuery from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), getDay, locales });

const getEventType = (event) => {
    if (!event || !event.type) return 'expense'; // Fallback
    if (event.type === 'fnx_income') {
        return 'fnx_income';
    }
    if (event.type === 'income') {
        return `income_${event.resource?.income_category || 'outros'}`;
    }
    return 'expense';
};

const eventTypeStyles = {
    fnx_income: { bgColor: 'bg-blue-600', textColor: 'text-blue-50', borderColor: 'border-blue-800', icon: ArrowDownCircle },
    income_boleto: { bgColor: 'bg-blue-600', textColor: 'text-blue-50', borderColor: 'border-blue-800', icon: ArrowDownCircle },
    income_spv: { bgColor: 'bg-orange-600', textColor: 'text-orange-50', borderColor: 'border-orange-800', icon: ArrowDownCircle },
    income_venda_direta: { bgColor: 'bg-teal-600', textColor: 'text-teal-50', borderColor: 'border-teal-800', icon: ArrowDownCircle },
    income_outros: { bgColor: 'bg-emerald-600', textColor: 'text-emerald-50', borderColor: 'border-emerald-800', icon: ArrowDownCircle },
    expense: { bgColor: 'bg-red-600', textColor: 'text-red-50', borderColor: 'border-red-800', icon: ArrowUpCircle },
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

const FinancialCalendar = ({ events, onSelectEvent, onUpdateStatus, date, onNavigate }) => {
    const [currentView, setCurrentView] = useState('month');
    const isMobile = useMediaQuery('(max-width: 767px)');
    React.useEffect(() => { setCurrentView(isMobile ? 'day' : 'month'); }, [isMobile]);

    const handleEventClick = useCallback((event, e) => {
        if (!event || !event.resource) return;
        const target = e.target;
        if (target.closest('.status-toggle-button')) {
            e.stopPropagation();
            return;
        }
        if (event.resource.is_fnx) return;
        onSelectEvent(event.resource);
    }, [onSelectEvent]);

    const EventComponent = ({ event }) => {
        const eventType = getEventType(event);
        const style = eventTypeStyles[eventType] || eventTypeStyles.expense;
        const Icon = style.icon;
        const isPaid = event.resource?.status === 'paid';
        const isFnx = event.resource?.is_fnx;

        const handleStatusToggle = (e) => {
            e.stopPropagation();
            const newStatus = isPaid ? 'pending' : 'paid';
            onUpdateStatus(event.resource.id, newStatus);
        };
        
        const content = (
          <div className={cn('p-1 rounded-md text-xs truncate flex items-center justify-between h-full w-full', style.bgColor, style.textColor, isPaid && 'opacity-60 line-through', isMobile ? 'text-[0.7rem] leading-tight flex-col items-start p-1.5' : 'flex-row items-center')}>
                <div className="flex items-center truncate w-full">
                    <Icon className={cn("w-3.5 h-3.5 mr-1.5 flex-shrink-0", isMobile ? 'w-3 h-3 mr-1' : '')} />
                    <span className="truncate flex-1">{isMobile ? event.title?.split(':')[0] : event.title}</span>
                </div>
                 {isMobile && <span className="font-bold text-left w-full pl-5">{event.title?.split(':')[1]}</span>}
                {!isFnx && (
                    <button onClick={handleStatusToggle} className={cn("status-toggle-button p-0.5 rounded-full hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white", isMobile ? "absolute top-1 right-1" : "ml-1")}>
                        {isPaid ? <XCircle className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                    </button>
                )}
            </div>
        );

        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                       {content}
                    </TooltipTrigger>
                    <TooltipContent className="bg-background text-foreground border-border">
                        <p className="font-bold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{isFnx ? "Recebimento de contrato" : "Lançamento manual"}</p>
                        <p className="text-xs text-muted-foreground">Status: {isPaid ? "Pago" : "Pendente"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };
    
    const eventPropGetter = useCallback((event) => {
        if (!event || !event.type) return {};
        const eventType = getEventType(event);
        const style = eventTypeStyles[eventType] || eventTypeStyles.expense;
        return {
            className: cn(
                style.bgColor, 
                'border-l-2 sm:border-l-4', 
                style.borderColor,
                event.resource?.status === 'paid' && 'opacity-60',
                isMobile ? 'py-0.5 px-1' : 'py-1 px-1.5',
                event.resource?.is_fnx ? 'cursor-default' : 'cursor-pointer',
                "relative"
            ),
            style: { 
                borderRadius: '3px', 
                fontSize: isMobile ? '0.7rem' : '0.78rem', 
                opacity: 0.9,
                padding: isMobile ? '2px' : 'auto',
            }
        };
    }, [isMobile]);

    const messages = { allDay: 'Dia todo', previous: '<', next: '>', today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Lista', date: 'Data', time: 'Hora', event: 'Evento', noEventsInRange: 'Não há lançamentos neste período.', showMore: total => `+${total}` };

    const safeEvents = useMemo(() => events.filter(e => e && e.start && e.end), [events]);

    return (
        <div className={cn("p-1 sm:p-2", isMobile ? "h-[calc(100vh-150px)]" : "h-[600px]")}>
            <Calendar
                localizer={localizer}
                events={safeEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                messages={messages}
                culture="pt-BR"
                date={date}
                view={currentView}
                onNavigate={onNavigate}
                onView={setCurrentView}
                onSelectEvent={handleEventClick}
                popup={!isMobile}
                components={{ toolbar: (props) => <CustomToolbar {...props} isMobile={isMobile} />, event: EventComponent }}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                eventPropGetter={eventPropGetter}
                dayPropGetter={(date) => ({ className: events.some(event => event?.start && new Date(event.start).toDateString() === date.toDateString()) ? 'bg-primary/5 hover:bg-primary/10' : '' })}
                slotPropGetter={() => ({ className: 'hover:bg-muted/30' })}
                className={cn("text-foreground [&_.rbc-header]:text-primary/80 [&_.rbc-header]:border-border/50 [&_.rbc-off-range-bg]:bg-muted/10 [&_.rbc-today]:bg-accent/10 [&_.rbc-event:focus]:outline-none [&_.rbc-event:focus]:ring-1 [&_.rbc-event:focus]:ring-ring [&_.rbc-event.rbc-selected]:bg-ring/80 [&_.rbc-event.rbc-selected]:shadow-lg", isMobile ? "[&_.rbc-header]:text-sm [&_.rbc-header]:p-1.5 [&_.rbc-time-gutter]:text-xs [&_.rbc-time-slot]:text-xs [&_.rbc-day-slot_.rbc-event]:min-h-[40px]" : "")}
            />
        </div>
    );
};

export default FinancialCalendar;