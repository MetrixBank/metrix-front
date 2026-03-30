import React, { useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, MapPin, User, Search, Filter 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getStatusBadge, getActivityTypePortuguese, getStatusPortuguese } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const TeamAgendaTab = ({ activities = [], distributors = [], loading, dateFilter }) => {
    
    // Filter activities based on the shared date filter from dashboard
    const filteredActivities = useMemo(() => {
        let filtered = [...activities];

        // Apply Date Range
        if (dateFilter.startDate) {
            const start = new Date(dateFilter.startDate);
            filtered = filtered.filter(a => new Date(a.visit_date) >= start);
        }
        if (dateFilter.endDate) {
            const end = new Date(dateFilter.endDate);
            filtered = filtered.filter(a => new Date(a.visit_date) <= end);
        }

        // Sort by date descending (most recent first)
        return filtered.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    }, [activities, dateFilter]);

    // Group activities by date
    const groupedActivities = useMemo(() => {
        const groups = {};
        filteredActivities.forEach(activity => {
            const dateKey = activity.visit_date ? format(new Date(activity.visit_date), 'yyyy-MM-dd') : 'no-date';
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(activity);
        });
        
        // Sort groups keys descending
        return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(dateKey => ({
            date: dateKey === 'no-date' ? null : dateKey,
            items: groups[dateKey]
        }));
    }, [filteredActivities]);

    const getDistributor = (id) => distributors.find(d => d.id === id) || { name: 'Desconhecido', avatar_url: null };

    if (loading) return <Skeleton className="h-[500px] w-full rounded-xl" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-emerald-500" />
                    Agenda da Equipe
                </h2>
                <p className="text-slate-400">
                    Visualize todas as atividades consolidadas da sua equipe em ordem cronológica.
                </p>
                {dateFilter.preset !== 'all' && (
                     <p className="text-xs text-emerald-400 font-medium mt-1">
                        Filtrando por: {dateFilter.label}
                    </p>
                )}
            </div>

            <Card className="bg-slate-900/40 border-slate-800 shadow-lg">
                <CardHeader className="pb-3 border-b border-slate-800/60">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-slate-200">Cronograma de Atividades</CardTitle>
                        <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                            {filteredActivities.length} Atividades
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px] p-4">
                        {groupedActivities.length > 0 ? (
                            <div className="space-y-8">
                                {groupedActivities.map((group) => (
                                    <div key={group.date || 'no-date'} className="relative pl-6 border-l border-slate-800">
                                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-500" />
                                        
                                        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider pl-2">
                                            {group.date 
                                                ? format(new Date(group.date), "EEEE, dd 'de' MMMM", { locale: ptBR }) 
                                                : 'Sem Data'}
                                        </h3>

                                        <div className="space-y-3">
                                            {group.items.map((activity) => {
                                                const distributor = getDistributor(activity.distributor_id);
                                                const statusClass = getStatusBadge(activity.status);
                                                
                                                return (
                                                    <div 
                                                        key={activity.id} 
                                                        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all"
                                                    >
                                                        {/* Time & Type Column */}
                                                        <div className="min-w-[120px] flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
                                                            <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                                                                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                                                {activity.visit_date 
                                                                    ? format(new Date(activity.visit_date), 'HH:mm') 
                                                                    : '--:--'}
                                                            </div>
                                                            <Badge variant="outline" className="text-xs bg-slate-950 border-slate-700 text-slate-400 capitalize">
                                                                {getActivityTypePortuguese(activity.activity_type)}
                                                            </Badge>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-semibold text-slate-200 text-base">{activity.customer_name}</h4>
                                                                <Badge className={`text-[10px] px-2 py-0.5 uppercase ${statusClass}`}>
                                                                    {getStatusPortuguese(activity.status)}
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate max-w-[200px] sm:max-w-md">
                                                                    {activity.customer_address_city ? `${activity.customer_address_city} - ` : ''}
                                                                    {activity.customer_name}
                                                                </span>
                                                            </div>

                                                            {activity.notes && (
                                                                <p className="text-xs text-slate-500 italic line-clamp-1 border-l-2 border-slate-700 pl-2">
                                                                    "{activity.notes}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Distributor & Value */}
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 min-w-[140px] pl-0 sm:pl-4 sm:border-l border-slate-800">
                                                            <div className="flex items-center gap-2" title={distributor.name}>
                                                                <span className="text-xs text-slate-400 hidden sm:inline text-right truncate max-w-[100px]">
                                                                    {distributor.name}
                                                                </span>
                                                                <Avatar className="h-6 w-6 border border-slate-700">
                                                                    <AvatarImage src={distributor.avatar_url} />
                                                                    <AvatarFallback className="text-[9px] bg-slate-800 text-slate-400">
                                                                        {distributor.name?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                            
                                                            {activity.sale_value > 0 && (
                                                                <span className="text-emerald-400 font-bold text-sm">
                                                                    {formatCurrency(activity.sale_value)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhuma atividade encontrada para o período selecionado.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamAgendaTab;