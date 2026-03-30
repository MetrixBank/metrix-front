import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import KanbanCard from './KanbanCard';
import { formatCurrency } from '@/lib/utils';

const KanbanColumn = ({ columnId, title, config, activities, onCardClick, isDropDisabled = false }) => {
  
  // Calculate column totals
  const totalValue = activities.reduce((sum, act) => {
      // Only sum up values for sales or potential sales if estimated_value exists
      // For 'sale_made', use actual sale_value
      if (columnId === 'sale_made') return sum + (Number(act.sale_value) || 0);
      return sum + (Number(act.estimated_value) || 0);
  }, 0);

  const ColumnHeader = () => (
    <div className={`p-3 border-b border-white/5 flex flex-col gap-1 sticky top-0 bg-[#0f1115] z-10 backdrop-blur-sm bg-opacity-95`}>
        <div className="flex justify-between items-center">
            <h3 className={`font-bold text-sm uppercase tracking-wider ${config.headerColor}`}>
                {title}
            </h3>
            <span className="text-[10px] font-bold text-white/40 bg-white/5 rounded px-1.5 py-0.5 min-w-[20px] text-center">
                {activities.length}
            </span>
        </div>
        {totalValue > 0 && (
            <div className="text-xs font-medium text-white/50">
                Total: <span className="text-white/80">{formatCurrency(totalValue)}</span>
            </div>
        )}
        <div className={`h-0.5 w-full mt-2 rounded-full bg-gradient-to-r ${config.bgGradient.replace('to-transparent', 'to-white/5')}`} />
    </div>
  );

  return (
    <div className="flex flex-col h-full min-w-[300px] w-[300px] bg-[#161922] rounded-xl border border-white/5 flex-shrink-0 snap-start">
      <ColumnHeader />
      
      {isDropDisabled ? (
        <div className="flex-grow p-2 overflow-y-auto custom-scrollbar">
            {activities.map((activity, index) => (
                <KanbanCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    onCardClick={onCardClick}
                    isDragDisabled={true}
                />
            ))}
        </div>
      ) : (
        <Droppable droppableId={columnId} isDropDisabled={isDropDisabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-grow p-2 overflow-y-auto custom-scrollbar transition-colors duration-200 
                ${snapshot.isDraggingOver ? 'bg-white/5' : ''}
              `}
            >
              {activities.map((activity, index) => (
                <KanbanCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  onCardClick={onCardClick}
                  isDragDisabled={isDropDisabled}
                />
              ))}
              {provided.placeholder}
              <div className="h-10" /> {/* Bottom spacing */}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default KanbanColumn;