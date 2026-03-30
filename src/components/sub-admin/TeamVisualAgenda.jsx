import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getActivityTypeTailwindColor, getActivityTypePortuguese } from '@/lib/utils';
import { Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';

const TeamVisualAgenda = ({ activities, distributors, loading, dateFilter }) => {
    
    // Filter activities
    const filteredActivities = useMemo(() => {
        let filtered = [...activities];
        if (dateFilter.startDate) {
            const start = new Date(dateFilter.startDate);
            filtered = filtered.filter(a => new Date(a.visit_date) >= start);
        }
        if (dateFilter.endDate) {
            const end = new Date(dateFilter.endDate);
            filtered = filtered.filter(a => new Date(a.visit_date) <= end);
        }
        return filtered.sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    }, [activities, dateFilter]);

    // Generate days for the view
    const daysToRender = useMemo(() => {
        const start = dateFilter.startDate ? new Date(dateFilter.startDate) : startOfMonth(new Date());
        const end = dateFilter.endDate ? new Date(dateFilter.endDate) : endOfMonth(new Date());
        
        // Safety cap for 'all time' or huge ranges
        if (!dateFilter.startDate) {
            // Default to current month view if 'All' is selected or invalid
             const now = new Date();
             return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
        }

        return eachDayOfInterval({ start, end });
    }, [dateFilter]);

    const getDistributor = (id) => distributors.find(d => d.id === id) || { name: 'Desconhecido', avatar_url: null };

    const getActivitiesForDay = (date) => {
        return filteredActivities.filter(activity => isSameDay(new Date(activity.visit_date), date));
    };

    if (loading) return <Skeleton className="w-full h-[600px] rounded-xl bg-slate-800/30" />;

    return (
        <div className="space-y-6">
             <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-emerald-500" />
                    Agenda Visual
                </h2>
                <p className="text-slate-400">
                    Visualização cronológica das atividades da equipe.
                </p>
                {dateFilter.preset !== 'all' && (
                     <p className="text-xs text-emerald-400 font-medium mt-1">
                        Filtrando por: {dateFilter.label}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                 {/* Legend - Desktop */}
                 <div className="hidden md:flex flex-wrap gap-4 col-span-full mb-2 p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mr-2 self-center">Legenda:</span>
                    <div className="flex items-center gap-1 text-xs text-slate-300"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Venda</div>
                    <div className="flex items-center gap-1 text-xs text-slate-300"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Visita</div>
                    <div className="flex items-center gap-1 text-xs text-slate-300"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Prospecção</div>
                    <div className="flex items-center gap-1 text-xs text-slate-300"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Reunião</div>
                    <div className="flex items-center gap-1 text-xs text-slate-300"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Outro</div>
                </div>

                <div className="col-span-full space-y-4">
                    {daysToRender.map((day) => {
                        const dayActivities = getActivitiesForDay(day);
                        const isTodayDate = isToday(day);
                        
                        // Skip empty days if the range is large (e.g. month view with sparse data), 
                        // unless it's "today" or "week" view where empty days are relevant context.
                        if (dayActivities.length === 0 && dateFilter.preset === 'all') return null;

                        return (
                            <Card key={day.toISOString()} className={`border-slate-800 bg-slate-900/40 ${isTodayDate ? 'border-emerald-500/30 bg-emerald-900/10' : ''}`}>
                                <div className="flex flex-col md:flex-row">
                                    {/* Date Column */}
                                    <div className={`p-4 md:w-48 flex-shrink-0 flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 border-b md:border-b-0 md:border-r border-slate-800 ${isTodayDate ? 'bg-emerald-500/10' : 'bg-slate-900/60'}`}>
                                        <div className="text-center md:text-left">
                                            <span className="block text-3xl font-bold text-slate-200">{format(day, 'dd')}</span>
                                            <span className="block text-sm font-medium text-slate-500 uppercase">{format(day, 'MMM, EEEE', { locale: ptBR })}</span>
                                        </div>
                                        {isTodayDate && <Badge className="bg-emerald-500 text-white border-0">Hoje</Badge>}
                                        <div className="md:mt-4 text-xs text-slate-500">
                                            {dayActivities.length} atividades
                                        </div>
                                    </div>

                                    {/* Activities Column */}
                                    <div className="flex-1 p-4">
                                        {dayActivities.length > 0 ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                {dayActivities.map(activity => {
                                                    const distributor = getDistributor(activity.distributor_id);
                                                    const colors = getActivityTypeTailwindColor(activity.activity_type || 'outros');

                                                    return (
                                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors group">
                                                            <div className={`mt-1 w-1.5 h-10 rounded-full ${colors.bg}`}></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className={`${colors.bgSoft} ${colors.text} ${colors.border} border text-[10px] uppercase px-1.5 py-0`}>
                                                                            {getActivityTypePortuguese(activity.activity_type)}
                                                                        </Badge>
                                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {format(new Date(activity.visit_date), 'HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <h4 className="font-medium text-slate-200 mt-1 truncate">{activity.customer_name}</h4>
                                                                
                                                                <div className="flex items-center justify-between mt-2">
                                                                     <div className="flex items-center gap-1.5">
                                                                        <Avatar className="h-5 w-5 border border-slate-700">
                                                                            <AvatarImage src={distributor.avatar_url} />
                                                                            <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">
                                                                                {distributor.name?.[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-xs text-slate-400 truncate max-w-[100px]">
                                                                            {distributor.name}
                                                                        </span>
                                                                    </div>
                                                                    {activity.sale_value > 0 && (
                                                                         <span className="text-xs font-mono text-emerald-400 font-bold">
                                                                            R$ {Number(activity.sale_value).toLocaleString('pt-BR')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-600 text-sm italic min-h-[80px]">
                                                Sem atividades registradas para este dia.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TeamVisualAgenda;