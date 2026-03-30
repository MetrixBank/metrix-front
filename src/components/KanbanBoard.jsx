import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { supabase } from '@/lib/supabaseClient';
import { useActivityStatus } from '@/hooks/useActivityStatus';
import KanbanCard from './KanbanCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const KanbanBoard = () => {
  const { statuses, loading: statusesLoading } = useActivityStatus();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOpportunities = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We fetch opportunities and map them to columns based on their 'status' field (which currently stores the name or key)
    // However, with dynamic statuses, we need to match the status NAME.
    // Assuming 'status' column in sales_opportunities stores text like 'Agendada', 'Em Andamento'.
    // If it stores keys like 'scheduled', we might need a mapping, but the prompt implies dynamic names.
    // For now, we assume the DB stores the status Name or a Key that matches.
    // Standardizing on Name for display columns is easiest for dynamic user-created statuses.
    
    // NOTE: Default system uses keys like 'scheduled', 'in_progress'. 
    // The dynamic statuses will likely use Names. We need to handle this hybrid or migration.
    // For this implementation, we will try to match by Name or assume the column matches the status Name.
    
    const { data, error } = await supabase
      .from('sales_opportunities')
      .select('*')
      .eq('distributor_id', user.id);

    if (error) {
      console.error('Error fetching opportunities:', error);
    } else {
      setOpportunities(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOpportunities();

    // Subscribe to opportunities changes
    const channel = supabase
      .channel('kanban_opportunities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_opportunities' }, () => {
        fetchOpportunities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatusName = destination.droppableId;
    
    // Optimistic Update
    const updatedOpportunities = opportunities.map(opp => 
      opp.id === draggableId ? { ...opp, status: newStatusName } : opp
    );
    setOpportunities(updatedOpportunities);

    // Update DB
    const { error } = await supabase
      .from('sales_opportunities')
      .update({ status: newStatusName, updated_at: new Date() })
      .eq('id', draggableId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao mover', description: 'Falha ao atualizar status.' });
      fetchOpportunities(); // Revert
    }
  };

  // Helper to map DB status keys to Display Names if needed, 
  // or purely rely on the dynamic status names matching what's in the DB.
  // We'll normalize to lowercase for matching to be safe if keys differ slightly.
  const getColumnOpportunities = (statusName) => {
    return opportunities.filter(opp => {
      if (!opp.status) return false;
      // Simple normalization for matching: remove spaces, lowercase.
      // Or exact match. Let's try flexible matching since legacy data might exist.
      const s1 = opp.status.toLowerCase().trim();
      const s2 = statusName.toLowerCase().trim();
      
      // Mapping for legacy keys to new Default Statuses
      if (s1 === 'scheduled' && s2 === 'agendada') return true;
      if (s1 === 'in_progress' && s2 === 'em andamento') return true;
      if (s1 === 'proposal_sent' && s2 === 'proposta enviada') return true;
      if (s1 === 'sale_made' && s2 === 'concluída com venda') return true;
      
      return s1 === s2;
    });
  };

  if (statusesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-w-max px-4">
          {statuses.map((status) => (
            <div 
              key={status.id} 
              className="w-80 flex-shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col max-h-[calc(100vh-220px)]"
            >
              {/* Column Header */}
              <div 
                className="p-3 border-b border-slate-800 flex items-center gap-2 sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-xl"
                style={{ borderTop: `3px solid ${status.color}` }}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: status.color }} 
                />
                <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wide">
                  {status.name}
                </h3>
                <span className="ml-auto bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  {getColumnOpportunities(status.name).length}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status.name}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`
                      flex-1 p-2 overflow-y-auto transition-colors scrollbar-thin scrollbar-thumb-slate-700
                      ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''}
                    `}
                  >
                    {getColumnOpportunities(status.name).map((opp, index) => (
                      <KanbanCard key={opp.id} opportunity={opp} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;