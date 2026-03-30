import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Clock, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StrictModeDroppable } from './StrictModeDroppable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const FunnelKanbanView = ({ stages, leads, onLeadClick, onDragEnd }) => {
  if (!stages) return null;

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden pb-2">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-4 px-1 min-w-max">
          {stages.map((stage) => {
            const stageLeads = leads.filter(l => l.stage_id === stage.id);
            return (
              <div key={stage.id} className="w-[300px] flex flex-col h-full rounded-lg bg-muted/30 border border-muted shadow-sm">
                {/* Column Header */}
                <div className="p-3 border-b bg-card rounded-t-lg flex justify-between items-center sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-semibold text-sm truncate" title={stage.name}>{stage.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Droppable Area */}
                <StrictModeDroppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center h-20 text-muted-foreground opacity-50 border-2 border-dashed border-muted rounded-lg m-2">
                              <span className="text-xs">Vazio</span>
                          </div>
                      )}
                      
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onLeadClick(lead)}
                              className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all group border-l-4 ${
                                snapshot.isDragging ? 'shadow-xl ring-2 ring-primary/20 rotate-1 scale-105 z-50' : ''
                              }`}
                              style={{ 
                                  ...provided.draggableProps.style, 
                                  borderLeftColor: stage.color 
                              }}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm truncate pr-2 text-card-foreground">{lead.name}</div>
                                  <Avatar className="h-6 w-6 text-[10px]">
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                          {lead.name.substring(0,2).toUpperCase()}
                                      </AvatarFallback>
                                  </Avatar>
                                </div>
                                
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" /> {lead.phone}
                                </div>

                                {lead.message && (
                                  <div className="text-xs bg-muted/50 p-2 rounded text-muted-foreground line-clamp-2 italic">
                                    "{lead.message}"
                                  </div>
                                )}

                                <div className="flex justify-between items-center pt-2 border-t mt-1">
                                   <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-muted-foreground/20 text-muted-foreground">
                                      {lead.source || 'Manual'}
                                   </Badge>
                                   <span className="text-[10px] text-muted-foreground flex items-center gap-1" title={new Date(lead.created_at).toLocaleString()}>
                                      <Clock className="h-3 w-3" />
                                      {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR }) : 'Hoje'}
                                   </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
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

export default FunnelKanbanView;