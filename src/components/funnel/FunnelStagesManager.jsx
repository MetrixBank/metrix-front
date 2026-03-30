import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Plus, Trash2, Edit2, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#f97316', '#ec4899', '#64748b'];

const FunnelStagesManager = ({ stages, createStage, updateStage, deleteStage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: COLORS[0] });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Create a copy to manipulate
    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update backend with new orders
    // In production, batch update is better. Here we iterate (simplified)
    items.forEach((item, index) => {
      const newOrder = index + 1;
      if (item.stage_order !== newOrder) {
        updateStage(item.id, { stage_order: newOrder });
      }
    });
  };

  const openEdit = (stage) => {
    setEditingStage(stage);
    setFormData({ name: stage.name, color: stage.color || COLORS[0] });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingStage(null);
    setFormData({ name: '', color: COLORS[0] });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingStage) {
      await updateStage(editingStage.id, formData);
    } else {
      await createStage({ ...formData, stage_order: stages.length + 1 });
    }
    setIsModalOpen(false);
  };

  return (
    <Card className="border shadow-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Etapas do Funil</h3>
            <p className="text-sm text-muted-foreground">Personalize as colunas do seu quadro Kanban.</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-2" /> Nova Etapa</Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <StrictModeDroppable droppableId="stages-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {stages.map((stage, index) => (
                  <Draggable key={stage.id} draggableId={stage.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-all ${
                            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 scale-[1.02] z-10' : 'hover:border-primary/30'
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        
                        <div className="h-8 w-8 rounded-md border shadow-sm flex items-center justify-center shrink-0" style={{ backgroundColor: stage.color + '20', borderColor: stage.color }}>
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{stage.name}</span>
                                {stage.is_system && <Badge variant="secondary" className="text-[10px] h-4 px-1"><Lock className="h-2 w-2 mr-1" /> Sistema</Badge>}
                            </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(stage)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!stage.is_system && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteStage(stage.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Etapa</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Negociação" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                  <button 
                    key={color} 
                    type="button" 
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-foreground scale-110 shadow-md ring-2 ring-offset-2' : 'border-transparent hover:scale-110'}`} 
                    style={{ backgroundColor: color }} 
                    onClick={() => setFormData({...formData, color})} 
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FunnelStagesManager;