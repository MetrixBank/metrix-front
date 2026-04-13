import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import KanbanCard from './KanbanCard';
import { formatCurrency, cn } from '@/lib/utils';

const KanbanColumn = ({
  columnId,
  title,
  config,
  activities,
  onCardClick,
  isDropDisabled = false,
  appearance = 'default',
}) => {
  const totalValue = activities.reduce((sum, act) => {
    if (columnId === 'sale_made') return sum + (Number(act.sale_value) || 0);
    return sum + (Number(act.estimated_value) || 0);
  }, 0);

  const ColumnHeader = () => {
    if (appearance === 'nocturnal') {
      return (
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-[#a0fff0] shadow-[0_0_8px_#a0fff0]"
              aria-hidden
            />
            <span className="truncate font-['Manrope'] text-xs font-bold uppercase tracking-wide text-white/90">
              {title}
            </span>
          </div>
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-plusJakarta text-xs font-medium text-white/80">
            {activities.length}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`sticky top-0 z-10 flex flex-col gap-1 border-b border-white/5 bg-[#0f1115] bg-opacity-95 p-3 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-bold uppercase tracking-wider ${config.headerColor}`}
          >
            {title}
          </h3>
          <span className="min-w-[20px] rounded bg-white/5 px-1.5 py-0.5 text-center text-[10px] font-bold text-white/40">
            {activities.length}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="text-xs font-medium text-white/50">
            Total:{' '}
            <span className="text-white/80">{formatCurrency(totalValue)}</span>
          </div>
        )}
        <div
          className={`mt-2 h-0.5 w-full rounded-full bg-gradient-to-r ${config.bgGradient.replace('to-transparent', 'to-white/5')}`}
        />
      </div>
    );
  };

  const columnShellClass =
    appearance === 'nocturnal'
      ? 'flex h-full min-w-[280px] w-[280px] flex-shrink-0 flex-col rounded-2xl bg-violet-950/25 snap-start'
      : 'flex h-full min-w-[300px] w-[300px] flex-shrink-0 flex-col rounded-xl border border-white/5 bg-[#161922] snap-start';

  return (
    <div className={columnShellClass}>
      <ColumnHeader />

      {isDropDisabled ? (
        <div className="custom-scrollbar flex-grow overflow-y-auto p-2">
          {activities.map((activity, index) => (
            <KanbanCard
              key={activity.id}
              activity={activity}
              index={index}
              onCardClick={onCardClick}
              isDragDisabled={true}
              appearance={appearance}
            />
          ))}
        </div>
      ) : (
        <Droppable droppableId={columnId} isDropDisabled={isDropDisabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'custom-scrollbar flex-grow overflow-y-auto p-2 transition-colors duration-200',
                snapshot.isDraggingOver && 'bg-white/5'
              )}
            >
              {activities.map((activity, index) => (
                <KanbanCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  onCardClick={onCardClick}
                  isDragDisabled={isDropDisabled}
                  appearance={appearance}
                />
              ))}
              {provided.placeholder}
              <div className="h-10" />
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default KanbanColumn;
