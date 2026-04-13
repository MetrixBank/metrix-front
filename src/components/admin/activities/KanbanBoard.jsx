import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import KanbanColumn from './KanbanColumn';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMN_KEYS = [
  'scheduled',
  'in_progress',
  'sale_made',
  'completed_no_sale',
  'postponed',
  'cancelled',
];

const NOCTURNAL_TITLES = {
  scheduled: 'AGENDADA',
  in_progress: 'EM PROGRESSO',
  sale_made: 'VENDA REALIZADA',
  completed_no_sale: 'CONCLUÍDA (S/ VENDA)',
  postponed: 'ADIADA',
  cancelled: 'CANCELADA',
};

const defaultColumns = {
  scheduled: {
    title: 'Agendada',
    borderColor: 'border-blue-500/50',
    headerColor: 'text-blue-400',
    bgGradient: 'from-blue-500/5 to-transparent',
  },
  in_progress: {
    title: 'Em Progresso',
    borderColor: 'border-amber-500/50',
    headerColor: 'text-amber-400',
    bgGradient: 'from-amber-500/5 to-transparent',
  },
  sale_made: {
    title: 'Venda Realizada',
    borderColor: 'border-emerald-500/50',
    headerColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/5 to-transparent',
  },
  completed_no_sale: {
    title: 'Concluída (S/ Venda)',
    borderColor: 'border-slate-500/50',
    headerColor: 'text-slate-400',
    bgGradient: 'from-slate-500/5 to-transparent',
  },
  postponed: {
    title: 'Adiada',
    borderColor: 'border-violet-500/50',
    headerColor: 'text-violet-400',
    bgGradient: 'from-violet-500/5 to-transparent',
  },
  cancelled: {
    title: 'Cancelada',
    borderColor: 'border-rose-500/50',
    headerColor: 'text-rose-400',
    bgGradient: 'from-rose-500/5 to-transparent',
  },
};

const neutralConfig = {
  borderColor: '',
  headerColor: '',
  bgGradient: 'from-transparent to-transparent',
};

const KanbanBoard = ({
  activities,
  onDragEnd,
  onCardClick,
  enableDragAndDrop = true,
  appearance = 'default',
}) => {
  const columns =
    appearance === 'nocturnal'
      ? COLUMN_KEYS.reduce((acc, key) => {
          acc[key] = { title: NOCTURNAL_TITLES[key], ...neutralConfig };
          return acc;
        }, {})
      : defaultColumns;

  const columnIds =
    appearance === 'nocturnal' ? COLUMN_KEYS : Object.keys(columns);

  const activitiesByColumn = columnIds.reduce((acc, key) => {
    acc[key] = activities.filter((act) => act.status === key);
    return acc;
  }, {});

  const totalActivities = activities.length;

  if (totalActivities === 0 && appearance === 'default') {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-white/5 bg-[#161922] p-8 text-center">
        <div className="mb-4 rounded-full bg-white/5 p-6">
          <Inbox className="h-12 w-12 text-white/20" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-white">Quadro Vazio</h3>
        <p className="max-w-md text-white/40">
          Nenhuma atividade encontrada com os filtros atuais. Tente ajustar os
          filtros ou crie uma nova atividade para começar.
        </p>
      </div>
    );
  }

  const columnStripClass = cn(
    'flex h-full min-w-max gap-4',
    appearance === 'default' && 'snap-x snap-mandatory scroll-pl-4 px-2'
  );

  const ColumnsStrip = () => (
    <div className={columnStripClass} style={{ minWidth: 'max-content' }}>
      {columnIds.map((columnId) => {
        const column = columns[columnId];
        return (
          <KanbanColumn
            key={columnId}
            columnId={columnId}
            title={column.title}
            config={column}
            activities={activitiesByColumn[columnId]}
            onCardClick={onCardClick}
            isDropDisabled={!enableDragAndDrop}
            appearance={appearance}
          />
        );
      })}
      <div className="w-2 flex-shrink-0" />
    </div>
  );

  const BoardContent = () => (
    <div className="custom-scrollbar w-full overflow-x-auto pb-4">
      <ColumnsStrip />
    </div>
  );

  const boardInner = enableDragAndDrop ? (
    <DragDropContext onDragEnd={onDragEnd}>
      <BoardContent />
    </DragDropContext>
  ) : (
    <BoardContent />
  );

  if (appearance === 'nocturnal' && totalActivities === 0) {
    const emptyBlock = (
      <div
        className={cn(
          'flex w-full shrink-0 flex-col items-center rounded-2xl px-6 py-10 text-center',
          'bg-violet-950/15'
        )}
      >
        <div className="mb-4 rounded-full bg-white/5 p-6">
          <Inbox className="h-12 w-12 text-violet-300/25" />
        </div>
        <h3 className="mb-2 font-['Manrope'] text-xl font-bold text-white">
          Quadro vazio
        </h3>
        <p className="font-plusJakarta max-w-md text-sm text-violet-200/45">
          Nenhuma atividade encontrada com os filtros atuais. Tente ajustar os
          filtros ou crie uma nova atividade para começar.
        </p>
      </div>
    );

    const scrollableNocturnalEmpty = (
      <div className="custom-scrollbar w-full overflow-x-auto pb-4">
        <div className="inline-flex w-max min-w-full flex-col items-stretch gap-8">
          <ColumnsStrip />
          {emptyBlock}
        </div>
      </div>
    );

    return enableDragAndDrop ? (
      <DragDropContext onDragEnd={onDragEnd}>{scrollableNocturnalEmpty}</DragDropContext>
    ) : (
      scrollableNocturnalEmpty
    );
  }

  return boardInner;
};

export default KanbanBoard;
