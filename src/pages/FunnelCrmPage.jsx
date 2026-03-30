import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AreaHeader from '@/components/ui/AreaHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Zap, RefreshCw, Search, AlertCircle, LayoutList, Kanban as KanbanIcon } from 'lucide-react';
import ContactList from '@/components/ContactList';
import ContactDetail from '@/components/ContactDetail';
import { useToast } from '@/components/ui/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import KanbanBoard from '@/components/KanbanBoard';
import StatusManagerButton from '@/components/StatusManagerButton';

const FunnelCrmPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('distributor_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter for Valid Contacts (Task 5)
      const validContacts = (data || []).filter(c => c.name && c.phone);
      setContacts(validContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError("Erro ao carregar contatos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchContacts();
    }
    
    // Real-time updates (Task 5)
    const subscription = supabase
      .channel('contacts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
          // If insert or update, refresh list or optimistically update
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             if (viewMode === 'list') {
               toast({ title: "Atualização", description: "Novos dados recebidos." });
               fetchContacts(); 
             }
          }
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [viewMode]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <AreaHeader 
        icon={Zap}
        title="Funil + CRM"
        subtitle="Gerencie seu funil de vendas e contatos em tempo real"
        actionButton={
            <div className="flex items-center gap-2">
                <StatusManagerButton />
                <Button variant="outline" size="sm" onClick={fetchContacts} className="border-slate-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>
        }
      />

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-6 flex-1 flex flex-col">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
           {viewMode === 'list' && (
             <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
               <Input 
                 placeholder="Buscar contatos..." 
                 className="pl-9 bg-slate-950 border-slate-700 text-slate-200"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           )}
           
           <div className="flex items-center gap-4 ml-auto w-full md:w-auto">
             {viewMode === 'list' && (
               <div className="text-sm text-slate-400 hidden md:block">
                  {filteredContacts.length} contatos
               </div>
             )}
             
             <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} className="border border-slate-700 rounded-lg p-1">
                <ToggleGroupItem value="list" aria-label="Lista" className="data-[state=on]:bg-slate-700">
                    <LayoutList className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="kanban" aria-label="Kanban" className="data-[state=on]:bg-slate-700">
                    <KanbanIcon className="h-4 w-4" />
                </ToggleGroupItem>
             </ToggleGroup>
           </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="p-8 text-center text-red-400 bg-slate-900 rounded-xl border border-red-900/30">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            {error}
          </div>
        ) : (
          <div className="flex-1 min-h-0">
             {viewMode === 'list' ? (
                <ContactList 
                  contacts={filteredContacts} 
                  loading={loading} 
                  onSelectContact={setSelectedContact}
                />
             ) : (
                <KanbanBoard />
             )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 p-0 text-slate-100 h-[80vh]">
            <ContactDetail 
                contact={selectedContact} 
                onClose={() => setSelectedContact(null)}
                onUpdate={fetchContacts}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelCrmPage;