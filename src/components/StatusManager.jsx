import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Trash2, Edit2, Plus, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActivityStatus } from '@/hooks/useActivityStatus';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Slate', value: '#64748b', bg: 'bg-slate-500' },
];

const StatusItem = ({ status, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={status.id} index={index} isDragDisabled={status.is_locked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg mb-2 group transition-colors",
            snapshot.isDragging && "border-blue-500 shadow-xl",
            status.is_locked && "opacity-80 bg-slate-900/50"
          )}
        >
          <div {...provided.dragHandleProps} className={cn("text-slate-500 cursor-grab hover:text-slate-300", status.is_locked && "cursor-not-allowed opacity-50")}>
            <GripVertical className="h-5 w-5" />
          </div>
          
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0" 
            style={{ backgroundColor: status.color }} 
          />
          
          <div className="flex-1 font-medium text-slate-200">
            {status.name}
            {status.is_locked && <span className="ml-2 text-xs text-slate-500 italic">(Padrão do Sistema)</span>}
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {!status.is_locked && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(status)} className="h-8 w-8 text-slate-400 hover:text-blue-400">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(status.id)} className="h-8 w-8 text-slate-400 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const StatusForm = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || COLORS[0].value);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, color });
  };

  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg mb-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-4">
        <div>
          <Label>Nome do Status</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ex: Em Negociação"
            className="mt-1.5 bg-slate-950 border-slate-700"
            autoFocus
          />
        </div>
        
        <div>
          <Label>Cor de Identificação</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500",
                  c.bg,
                  color === c.value && "ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110"
                )}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            {initialData ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatusManager = ({ isOpen, onClose }) => {
  const { statuses, addStatus, updateStatus, removeStatus, reorderStatuses } = useActivityStatus();
  const [isAdding, setIsAdding] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(statuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Ensure locked statuses (like "Concluída com Venda") generally stay at the end if desired, 
    // but typically user might want to reorder everything EXCEPT locked ones. 
    // For now, we allow reordering logic to handle it, but UI prevents dragging locked items.
    
    reorderStatuses(items);
  };

  const handleSaveNew = async (data) => {
    await addStatus(data.name, data.color);
    setIsAdding(false);
  };

  const handleUpdate = async (data) => {
    if (editingStatus) {
      await updateStatus(editingStatus.id, data);
      setEditingStatus(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Gerenciar Status do Funil</DialogTitle>
          <DialogDescription className="text-slate-400">
            Personalize as colunas do seu quadro Kanban. Arraste para reordenar.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {!isAdding && !editingStatus && (
            <Button 
              onClick={() => setIsAdding(true)} 
              className="w-full mb-4 border-dashed border-2 border-slate-700 bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Status
            </Button>
          )}

          {isAdding && (
            <StatusForm 
              onSave={handleSaveNew} 
              onCancel={() => setIsAdding(false)} 
            />
          )}

          {editingStatus && (
            <StatusForm 
              initialData={editingStatus}
              onSave={handleUpdate}
              onCancel={() => setEditingStatus(null)}
            />
          )}

          <ScrollArea className="h-[400px] pr-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="statuses">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {statuses.map((status, index) => (
                      <StatusItem 
                        key={status.id} 
                        status={status} 
                        index={index}
                        onEdit={setEditingStatus}
                        onDelete={removeStatus}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusManager;