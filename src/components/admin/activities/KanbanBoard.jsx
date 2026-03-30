import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import KanbanColumn from './KanbanColumn';
import { Inbox } from 'lucide-react';

const KanbanBoard = ({ activities, onDragEnd, onCardClick, enableDragAndDrop = true }) => {
  // Enterprise style column definitions
  const columns = {
    scheduled: { 
        title: 'Agendada', 
        borderColor: 'border-blue-500/50',
        headerColor: 'text-blue-400',
        bgGradient: 'from-blue-500/5 to-transparent'
    },
    in_progress: { 
        title: 'Em Progresso', 
        borderColor: 'border-amber-500/50',
        headerColor: 'text-amber-400',
        bgGradient: 'from-amber-500/5 to-transparent'
    },
    sale_made: { 
        title: 'Venda Realizada', 
        borderColor: 'border-emerald-500/50',
        headerColor: 'text-emerald-400',
        bgGradient: 'from-emerald-500/5 to-transparent'
    },
    completed_no_sale: { 
        title: 'Concluída (S/ Venda)', 
        borderColor: 'border-slate-500/50',
        headerColor: 'text-slate-400',
        bgGradient: 'from-slate-500/5 to-transparent'
    },
    postponed: { 
        title: 'Adiada', 
        borderColor: 'border-violet-500/50',
        headerColor: 'text-violet-400',
        bgGradient: 'from-violet-500/5 to-transparent'
    },
    cancelled: { 
        title: 'Cancelada', 
        borderColor: 'border-rose-500/50',
        headerColor: 'text-rose-400',
        bgGradient: 'from-rose-500/5 to-transparent'
    },
  };

  const activitiesByColumn = Object.keys(columns).reduce((acc, key) => {
    acc[key] = activities.filter(act => act.status === key);
    return acc;
  }, {});

  const totalActivities = activities.length;

  if (totalActivities === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-center p-8 bg-[#161922] rounded-xl border border-white/5">
        <div className="bg-white/5 p-6 rounded-full mb-4">
            <Inbox className="w-12 h-12 text-white/20" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Quadro Vazio</h3>
        <p className="text-white/40 max-w-md">
            Nenhuma atividade encontrada com os filtros atuais. Tente ajustar os filtros ou crie uma nova atividade para começar.
        </p>
      </div>
    );
  }

  const BoardContent = () => (
    <div className="flex h-full overflow-x-auto pb-4 gap-4 px-2 snap-x snap-mandatory scroll-pl-4" style={{ minWidth: 'max-content' }}>
      {Object.entries(columns).map(([columnId, column]) => (
        <KanbanColumn
          key={columnId}
          columnId={columnId}
          title={column.title}
          config={column}
          activities={activitiesByColumn[columnId]}
          onCardClick={onCardClick}
          isDropDisabled={!enableDragAndDrop}
        />
      ))}
      {/* Spacer for right scroll padding */}
      <div className="w-2 flex-shrink-0" />
    </div>
  );

  return enableDragAndDrop ? (
    <DragDropContext onDragEnd={onDragEnd}>
      <BoardContent />
    </DragDropContext>
  ) : (
    <BoardContent />
  );
};

export default KanbanBoard;