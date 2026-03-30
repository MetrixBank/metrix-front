import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, Phone, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const KanbanCard = ({ opportunity, index }) => {
  const formattedDate = opportunity.visit_date 
    ? format(new Date(opportunity.visit_date), "d 'de' MMM", { locale: ptBR })
    : 'Sem data';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm mb-3 
            hover:border-slate-500 hover:shadow-md transition-all
            ${snapshot.isDragging ? 'shadow-lg rotate-2 ring-2 ring-blue-500/50' : ''}
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-slate-100 text-sm line-clamp-2">
              {opportunity.customer_name || 'Cliente Sem Nome'}
            </h4>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            {opportunity.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{opportunity.customer_phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>

            {(opportunity.estimated_value > 0 || opportunity.sale_value > 0) && (
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(opportunity.sale_value || opportunity.estimated_value)}</span>
              </div>
            )}

            {opportunity.consultant_name && (
              <div className="flex items-center gap-2">
                 <User className="h-3 w-3" />
                 <span className="truncate max-w-[150px]">{opportunity.consultant_name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;