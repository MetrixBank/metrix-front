import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Loader2, DollarSign, Calendar, Clock, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { getStatusPortuguese, formatCurrency } from '@/lib/utils';
import AddSalesActivityModal from '@/components/AddSalesActivityModal';
import { useDataSync } from '@/contexts/DataSyncContext';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS = {
  'scheduled': { title: 'Agendado', color: 'border-l-amber-500' },
  'in_progress': { title: 'Em Andamento', color: 'border-l-blue-500' },
  'sale_made': { title: 'Venda Realizada', color: 'border-l-emerald-500' },
  'completed_no_sale': { title: 'Sem Venda', color: 'border-l-slate-400' },
  'postponed': { title: 'Adiado', color: 'border-l-purple-500' },
  'cancelled': { title: 'Cancelado', color: 'border-l-rose-500' }
};

const SalesFunnelTab = ({ user }) => {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const { syncKey, triggerSync } = useDataSync();

  const fetchKanbanData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: opportunities, error } = await supabase
        .from('sales_opportunities')
        .select(`
            *,
            opportunity_products (
                *,
                product:products (*)
            )
        `)
        .eq('distributor_id', user.id);

      if (error) throw error;

      // Group by status - include ALL statuses including cancelled
      const newColumns = {
        'scheduled': [],
        'in_progress': [],
        'sale_made': [],
        'completed_no_sale': [],
        'postponed': [],
        'cancelled': []
      };

      opportunities?.forEach(opp => {
        if (newColumns[opp.status]) {
          newColumns[opp.status].push(opp);
        }
      });
      
      // Sort each column by date (ascending for upcoming dates)
      Object.keys(newColumns).forEach(key => {
          newColumns[key].sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
      });

      setColumns(newColumns);
      
      // Fetch aux data
      const [custRes, prodRes] = await Promise.all([
         supabase.from('customers').select('*').eq('distributor_id', user.id),
         supabase.from('products').select('*').eq('distributor_id', user.id)
      ]);
      
      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);

    } catch (error) {
      console.error('Error fetching kanban:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar funil de vendas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData, syncKey]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const startStatus = source.droppableId;
    const endStatus = destination.droppableId;
    
    // Optimistic Update
    const sourceCol = [...columns[startStatus]];
    const destCol = [...columns[endStatus]];
    const [movedItem] = sourceCol.splice(source.index, 1);
    
    // Update local object
    const updatedItem = { ...movedItem, status: endStatus };
    destCol.splice(destination.index, 0, updatedItem);

    setColumns({
      ...columns,
      [startStatus]: sourceCol,
      [endStatus]: destCol
    });

    // Backend Update
    try {
        const { error } = await supabase
            .from('sales_opportunities')
            .update({ status: endStatus, updated_at: new Date() })
            .eq('id', draggableId);

        if (error) throw error;
        toast({ description: "Status atualizado com sucesso." });
        triggerSync(); // Sync other tabs
        
        // If moving to sale_made, maybe prompt for details? 
        // For simplicity, just update status. The user should edit to add products if needed.
        if (endStatus === 'sale_made' && startStatus !== 'sale_made') {
             toast({ 
                 title: "Venda Registrada!", 
                 description: "Não esqueça de editar para adicionar os produtos vendidos.",
                 duration: 5000 
             });
        }

    } catch (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        fetchKanbanData(); // Revert on error
    }
  };

  const handleEditActivity = (activity) => {
      setSelectedActivity(activity);
      setIsAddModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsAddModalOpen(false);
      setSelectedActivity(null);
  };

  const handleActivityAdded = () => {
      // This function is called when form is submitted successfully
      triggerSync(); // Sync global data
      fetchKanbanData(); // Refresh local board
      setIsAddModalOpen(false); // Close modal
      setSelectedActivity(null); // Clear selected
  };

  if (loading && !columns['scheduled']) {
      return (
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative w-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
         <h2 className="text-lg font-semibold flex items-center gap-2">
             <Filter className="w-5 h-5" /> Funil de Vendas (CRM)
         </h2>
         <Button onClick={() => { setSelectedActivity(null); setIsAddModalOpen(true); }} size="sm" className="gap-1">
             <Plus className="w-4 h-4" /> Nova Atividade
         </Button>
      </div>

      {/* Container for scrolling - Ensures full width and proper overflow handling */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden p-4 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
            {/* Inner container with w-max to force expansion beyond viewport width if needed */}
            <div className="flex gap-4 h-full w-max min-w-full">
                {Object.keys(COLUMNS).map(statusKey => (
                    <div 
                      key={statusKey} 
                      className="flex flex-col w-[280px] flex-shrink-0 h-full rounded-xl bg-muted/20 border border-border/50"
                    >
                        {/* Column Header */}
                        <div className={`p-3 border-b border-border/50 bg-muted/40 rounded-t-xl font-medium flex justify-between items-center ${COLUMNS[statusKey].color.replace('border-l-', 'border-l-4 ')}`}>
                            <span className="text-sm font-semibold">{COLUMNS[statusKey].title}</span>
                            <span className="bg-background text-xs px-2 py-0.5 rounded-full border border-border shadow-sm">
                                {columns[statusKey]?.length || 0}
                            </span>
                        </div>
                        
                        {/* Droppable Area */}
                        <Droppable droppableId={statusKey}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-2 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                                >
                                    {columns[statusKey]?.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => handleEditActivity(item)}
                                                    style={{ ...provided.draggableProps.style }}
                                                    className={`mb-3 select-none ${snapshot.isDragging ? 'z-50' : ''}`}
                                                >
                                                    <Card className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4" style={{ borderLeftColor: snapshot.isDragging ? 'var(--primary)' : 'transparent' }}>
                                                        <CardContent className="p-3 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-semibold text-sm line-clamp-1">{item.customer_name}</h4>
                                                            </div>
                                                            
                                                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{item.activity_type}</span>
                                                                {item.sale_value > 0 && (
                                                                    <span className="text-emerald-500 font-bold">{formatCurrency(item.sale_value)}</span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mt-2">
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    {new Date(item.visit_date).toLocaleDateString()}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {item.visit_time?.substring(0, 5)}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}
                                        </Draggable>
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
      
      {/* Explicitly conditionally render the modal to ensure unmount on close */}
      {isAddModalOpen && (
        <AddSalesActivityModal
            isOpen={isAddModalOpen}
            onClose={handleCloseModal}
            onActivityAdded={handleActivityAdded}
            user={user}
            activityData={selectedActivity}
            customers={customers}
            products={products}
        />
      )}
    </div>
  );
};

export default SalesFunnelTab;