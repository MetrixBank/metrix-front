import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
  Calendar,
  User,
  DollarSign,
  Clock,
  AlertCircle,
  Briefcase,
  Package,
} from 'lucide-react';
import {
  formatDate,
  formatCurrency,
  getActivityTypePortuguese,
  cn,
} from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const getTypeConfig = (type) => {
  switch (type) {
    case 'venda':
      return {
        label: 'Venda',
        color: 'bg-emerald-500/20 text-emerald-400',
        icon: DollarSign,
      };
    case 'visita':
      return {
        label: 'Visita',
        color: 'bg-blue-500/20 text-blue-400',
        icon: User,
      };
    case 'troca_refil':
      return {
        label: 'Refil',
        color: 'bg-cyan-500/20 text-cyan-400',
        icon: Package,
      };
    case 'manutencao':
      return {
        label: 'Manut.',
        color: 'bg-orange-500/20 text-orange-400',
        icon: Briefcase,
      };
    default:
      return {
        label: getActivityTypePortuguese(type),
        color: 'bg-slate-500/20 text-slate-400',
        icon: Briefcase,
      };
  }
};

const getLuxuryTypeStyle = (type) => {
  switch (type) {
    case 'venda':
      return 'bg-fuchsia-500/15 text-fuchsia-100/95';
    case 'visita':
      return 'bg-cyan-400/12 text-cyan-100/90';
    case 'troca_refil':
      return 'bg-cyan-500/14 text-cyan-50/95';
    case 'manutencao':
      return 'bg-violet-400/14 text-violet-100/90';
    case 'prospeccao':
      return 'bg-violet-500/18 text-violet-100/95';
    case 'reuniao':
      return 'bg-amber-400/12 text-amber-50/95';
    default:
      return 'bg-white/10 text-white/75';
  }
};

const KanbanCard = ({
  activity,
  index,
  onCardClick,
  isDragDisabled = false,
  appearance = 'default',
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitDate = activity.visit_date ? new Date(activity.visit_date) : null;

  const isOverdue =
    visitDate &&
    visitDate < today &&
    activity.status !== 'sale_made' &&
    activity.status !== 'completed_no_sale' &&
    activity.status !== 'cancelled';
  const isToday =
    visitDate && visitDate.getTime() === today.getTime();
  const isSale = activity.status === 'sale_made';

  const typeConfig = getTypeConfig(activity.activity_type);
  const TypeIcon = typeConfig.icon;

  const displayMoney = isSale
    ? Number(activity.sale_value) || 0
    : Number(activity.estimated_value) || 0;

  const DefaultCardContent = ({ isDragging }) => (
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

      <div className="flex justify-between items-start mb-2 pr-6">
        <div className="flex flex-col">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1 flex items-center gap-1 ${typeConfig.color}`}
          >
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
          </span>
          <h4 className="font-semibold text-sm text-white leading-tight line-clamp-2">
            {activity.customer_name || 'Sem Cliente'}
          </h4>
        </div>
      </div>

      <div className="space-y-2 mt-3">
        {(isSale || activity.estimated_value > 0) && (
          <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/5 p-1.5 rounded">
            <DollarSign className="w-3 h-3 mr-1" />
            {formatCurrency(isSale ? activity.sale_value : activity.estimated_value)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
          <div
            className={`flex items-center ${isOverdue ? 'text-rose-400 font-medium' : ''} ${isToday ? 'text-amber-400 font-medium' : ''}`}
          >
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

        {activity.opportunity_products?.length > 0 && (
          <div className="text-[10px] text-white/40 mt-1 truncate border-t border-white/5 pt-1 flex items-center gap-1">
            <Package className="w-3 h-3" />
            {activity.opportunity_products.length} produto(s)
          </div>
        )}

        {activity.distributor?.name && (
          <div className="text-[10px] text-white/30 flex items-center mt-1 truncate">
            <User className="w-3 h-3 mr-1" />
            {activity.distributor.name}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge
          variant="outline"
          className="bg-[#161922] text-[10px] border-white/10 hover:bg-primary hover:border-primary"
        >
          Ver Detalhes
        </Badge>
      </div>
    </div>
  );

  const NocturnalCardContent = ({ isDragging }) => {
    return (
      <div
        onClick={() => onCardClick(activity)}
        className={cn(
          'group relative mb-3 cursor-pointer overflow-hidden rounded-xl border border-transparent bg-white/[0.06] p-3 backdrop-blur-md transition-all duration-200',
          'hover:border-[#a0fff0]/35 hover:bg-white/[0.09] hover:shadow-[inset_0_0_0_1px_rgba(160,255,240,0.25)]',
          isDragging && 'z-50 scale-[1.02] ring-1 ring-violet-400/40',
          isOverdue && 'ring-1 ring-fuchsia-500/25',
          isToday && 'bg-amber-500/[0.07]'
        )}
      >
        {isOverdue && (
          <div className="absolute top-2 right-2">
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 animate-pulse text-fuchsia-300/85" />
              </TooltipTrigger>
              <TooltipContent>Atividade atrasada</TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="pr-7">
          <h4 className="line-clamp-2 font-['Manrope'] text-sm font-semibold text-white/95">
            {activity.customer_name || 'Sem cliente'}
          </h4>
        </div>

        <p className="mt-3 font-['Manrope'] text-xl font-bold tabular-nums tracking-tight text-white">
          {formatCurrency(displayMoney)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-plusJakarta text-[10px] font-medium',
              getLuxuryTypeStyle(activity.activity_type)
            )}
          >
            <TypeIcon className="h-3 w-3 shrink-0 opacity-90" />
            {getActivityTypePortuguese(activity.activity_type)}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 font-plusJakarta text-[11px] text-violet-200/55">
          <div
            className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-fuchsia-200/80',
              isToday && 'text-amber-200/90'
            )}
          >
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatDate(activity.visit_date)}</span>
          </div>
          {activity.visit_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{activity.visit_time.slice(0, 5)}</span>
            </div>
          )}
        </div>

        {activity.opportunity_products?.length > 0 && (
          <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2 font-plusJakarta text-[10px] text-violet-300/45">
            <Package className="h-3 w-3" />
            {activity.opportunity_products.length} produto(s)
          </div>
        )}

        {activity.distributor?.name && (
          <div className="mt-1.5 flex items-center truncate font-plusJakarta text-[10px] text-violet-300/40">
            <User className="mr-1 h-3 w-3 shrink-0" />
            {activity.distributor.name}
          </div>
        )}
      </div>
    );
  };

  const CardBody =
    appearance === 'nocturnal' ? NocturnalCardContent : DefaultCardContent;

  if (isDragDisabled) {
    return <CardBody isDragging={false} />;
  }

  return (
    <Draggable
      draggableId={String(activity.id)}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
        >
          <CardBody isDragging={snapshot.isDragging} />
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
