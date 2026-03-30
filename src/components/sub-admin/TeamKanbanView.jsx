import React, { useMemo, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getActivityTypeTailwindColor, getActivityTypePortuguese } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Helper for StrictMode in React 18
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

const TeamKanbanView = ({ activities, distributors, loading, dateFilter }) => {
    const { toast } = useToast();
    const [localActivities, setLocalActivities] = useState([]);

    // Sync local state when activities prop changes, but only if not dragging (handled by effect dependency)
    useEffect(() => {
        setLocalActivities(activities);
    }, [activities]);

    const filteredActivities = useMemo(() => {
        let filtered = [...localActivities];
        if (dateFilter.startDate) {
            const start = new Date(dateFilter.startDate);
            filtered = filtered.filter(a => new Date(a.visit_date) >= start);
        }
        if (dateFilter.endDate) {
            const end = new Date(dateFilter.endDate);
            filtered = filtered.filter(a => new Date(a.visit_date) <= end);
        }
        return filtered;
    }, [localActivities, dateFilter]);

    const columns = {
        'scheduled': {
            id: 'scheduled',
            title: 'Agendado / Pendente',
            status: ['scheduled', 'new', 'pending', 'contacted', 'prospecting'],
            color: 'border-t-purple-500',
            icon: Clock
        },
        'in_progress': {
            id: 'in_progress',
            title: 'Em Progresso',
            status: ['in_progress', 'visit_made'],
            color: 'border-t-blue-500',
            icon: AlertCircle
        },
        'completed': {
            id: 'completed',
            title: 'Concluído / Venda',
            status: ['sale_made', 'completed', 'won', 'paid', 'approved'],
            color: 'border-t-emerald-500',
            icon: CheckCircle2
        },
        'cancelled': {
            id: 'cancelled',
            title: 'Cancelado / Perdido',
            status: ['cancelled', 'lost', 'rejected', 'postponed'],
            color: 'border-t-red-500',
            icon: XCircle
        }
    };

    const getColumnId = (status) => {
        if (columns.scheduled.status.includes(status)) return 'scheduled';
        if (columns.in_progress.status.includes(status)) return 'in_progress';
        if (columns.completed.status.includes(status)) return 'completed';
        if (columns.cancelled.status.includes(status)) return 'cancelled';
        return 'scheduled'; // Default fallback
    };

    const getDistributor = (id) => distributors.find(d => d.id === id) || { name: 'Desconhecido', avatar_url: null };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const activityId = draggableId;
        const newColumnId = destination.droppableId;
        
        // Map column ID back to a specific status (defaults for drag actions)
        let newStatus = 'scheduled';
        if (newColumnId === 'in_progress') newStatus = 'in_progress';
        if (newColumnId === 'completed') newStatus = 'sale_made'; // Default to sale_made or completed
        if (newColumnId === 'cancelled') newStatus = 'cancelled';

        // Optimistic Update
        const updatedActivities = localActivities.map(act => 
            act.id === activityId ? { ...act, status: newStatus } : act
        );
        setLocalActivities(updatedActivities);

        try {
            const { error } = await supabase
                .from('sales_opportunities')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', activityId);

            if (error) throw error;

            toast({
                title: "Status atualizado",
                description: `A atividade foi movida para ${columns[newColumnId].title}`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            setLocalActivities(activities); // Revert
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: "Não foi possível mover a atividade.",
            });
        }
    };

    if (loading) return <Skeleton className="h-[600px] w-full bg-slate-800/20" />;

    return (
        <div className="h-full min-h-[600px] overflow-x-auto pb-4">
             {/* Legend */}
             <div className="flex flex-wrap gap-4 mb-4 px-1 text-xs text-slate-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Venda</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Visita</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Prospecção</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Reunião</div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 min-w-[1000px]">
                    {Object.values(columns).map((column) => {
                        const columnActivities = filteredActivities.filter(a => getColumnId(a.status) === column.id);
                        
                        return (
                            <div key={column.id} className="flex-1 min-w-[280px] bg-slate-900/30 rounded-xl border border-slate-800/60 flex flex-col">
                                <div className={`p-3 border-t-4 rounded-t-xl bg-slate-900/80 ${column.color} flex justify-between items-center`}>
                                    <div className="flex items-center gap-2 font-medium text-slate-200">
                                        <column.icon className="w-4 h-4 text-slate-400" />
                                        {column.title}
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700">
                                        {columnActivities.length}
                                    </Badge>
                                </div>
                                
                                <StrictModeDroppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 p-2 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''}`}
                                        >
                                            {columnActivities.map((activity, index) => {
                                                const distributor = getDistributor(activity.distributor_id);
                                                const typeColors = getActivityTypeTailwindColor(activity.activity_type || 'outros');

                                                return (
                                                    <Draggable key={activity.id} draggableId={activity.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <Card
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm group ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-emerald-500/20 z-50' : ''}`}
                                                            >
                                                                <CardContent className="p-3 space-y-3">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <Badge variant="outline" className={`${typeColors.bgSoft} ${typeColors.text} ${typeColors.border} border text-[10px] uppercase px-1.5 py-0`}>
                                                                            {getActivityTypePortuguese(activity.activity_type)}
                                                                        </Badge>
                                                                        {activity.visit_date && (
                                                                             <span className="text-[10px] text-slate-500 flex items-center gap-1 whitespace-nowrap">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {format(new Date(activity.visit_date), "dd MMM", { locale: ptBR })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-slate-200 line-clamp-1" title={activity.customer_name}>
                                                                            {activity.customer_name}
                                                                        </h4>
                                                                        {activity.notes && (
                                                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                                                                {activity.notes}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Avatar className="h-5 w-5 border border-slate-700">
                                                                                <AvatarImage src={distributor.avatar_url} />
                                                                                <AvatarFallback className="text-[8px] bg-slate-800 text-slate-400">
                                                                                    {distributor.name?.[0]}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                                                                                {distributor.name}
                                                                            </span>
                                                                        </div>
                                                                        {activity.sale_value > 0 && (
                                                                             <span className="text-xs font-semibold text-emerald-400">
                                                                                R$ {Number(activity.sale_value).toLocaleString('pt-BR')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </StrictModeDroppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
};

export default TeamKanbanView;