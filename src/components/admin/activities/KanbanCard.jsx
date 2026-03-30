import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, User, DollarSign, Clock, AlertCircle, Briefcase, Package } from 'lucide-react';
import { formatDate, formatCurrency, getActivityTypePortuguese } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const KanbanCard = ({ activity, index, onCardClick, isDragDisabled = false }) => {
  
  // --- Smart Logic for Visuals ---
  const today = new Date();
  today.setHours(0,0,0,0);
  const visitDate = activity.visit_date ? new Date(activity.visit_date) : null;
  
  const isOverdue = visitDate && visitDate < today && activity.status !== 'sale_made' && activity.status !== 'completed_no_sale' && activity.status !== 'cancelled';
  const isToday = visitDate && visitDate.getTime() === today.getTime();
  const isSale = activity.status === 'sale_made';

  // Activity Type config
  const getTypeConfig = (type) => {
      switch(type) {
          case 'venda': return { label: 'Venda', color: 'bg-emerald-500/20 text-emerald-400', icon: DollarSign };
          case 'visita': return { label: 'Visita', color: 'bg-blue-500/20 text-blue-400', icon: User };
          case 'troca_refil': return { label: 'Refil', color: 'bg-cyan-500/20 text-cyan-400', icon: Package };
          case 'manutencao': return { label: 'Manut.', color: 'bg-orange-500/20 text-orange-400', icon: Briefcase };
          default: return { label: getActivityTypePortuguese(type), color: 'bg-slate-500/20 text-slate-400', icon: Briefcase };
      }
  };
  
  const typeConfig = getTypeConfig(activity.activity_type);
  const TypeIcon = typeConfig.icon;

  const CardContent = ({ isDragging }) => (
    <div
      onClick={() => onCardClick(activity)}
      className={`
        relative group p-3 mb-3 bg-[#1e212b] border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden
        ${isDragging ? 'shadow-2xl ring-2 ring-primary rotate-2 scale-105 z-50' : ''}
        ${isOverdue ? 'border-l-4 border-l-rose-500 border-y-white/5 border-r-white/5' : ''}
        ${isToday ? 'border-l-4 border-l-amber-500 border-y-white/5 border-r-white/5 bg-[#252836]' : 'border-white/5'}
        hover:border-primary/50
      `}
    >
      {/* Overdue Indicator Dot */}
      {isOverdue && (
        <div className="absolute top-2 right-2">
            <Tooltip>
                <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>Atividade Atrasada</TooltipContent>
            </Tooltip>
        </div>
      )}

      {/* Header: Type & Customer */}
      <div className="flex justify-between items-start mb-2 pr-6">
        <div className="flex flex-col">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1 flex items-center gap-1 ${typeConfig.color}`}>
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
            </span>
            <h4 className="font-semibold text-sm text-white leading-tight line-clamp-2">
                {activity.customer_name || 'Sem Cliente'}
            </h4>
        </div>
      </div>

      {/* Body: Details Grid */}
      <div className="space-y-2 mt-3">
         {/* Value Row - Only if relevant */}
         {(isSale || activity.estimated_value > 0) && (
             <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/5 p-1.5 rounded">
                 <DollarSign className="w-3 h-3 mr-1" />
                 {formatCurrency(isSale ? activity.sale_value : activity.estimated_value)}
             </div>
         )}

         {/* Meta Info */}
         <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
             <div className={`flex items-center ${isOverdue ? 'text-rose-400 font-medium' : ''} ${isToday ? 'text-amber-400 font-medium' : ''}`}>
                 <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                 <span className="truncate">{formatDate(activity.visit_date)}</span>
             </div>
             {activity.visit_time && (
                 <div className="flex items-center">
                     <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                     <span>{activity.visit_time.slice(0, 5)}</span>
                 </div>
             )}
         </div>

         {/* Products Preview (if any) */}
         {activity.opportunity_products?.length > 0 && (
             <div className="text-[10px] text-white/40 mt-1 truncate border-t border-white/5 pt-1 flex items-center gap-1">
                 <Package className="w-3 h-3" />
                 {activity.opportunity_products.length} produto(s)
             </div>
         )}
         
         {/* Distributor Name (if different from user context, usually for admins) */}
         {activity.distributor?.name && (
             <div className="text-[10px] text-white/30 flex items-center mt-1 truncate">
                 <User className="w-3 h-3 mr-1" />
                 {activity.distributor.name}
             </div>
         )}
      </div>

      {/* Hover Quick Action Indicator (Subtle) */}
      <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="bg-[#161922] text-[10px] border-white/10 hover:bg-primary hover:border-primary">
              Ver Detalhes
          </Badge>
      </div>
    </div>
  );

  if (isDragDisabled) {
    return <CardContent isDragging={false} />;
  }

  return (
    <Draggable draggableId={String(activity.id)} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
        >
          <CardContent isDragging={snapshot.isDragging} />
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;