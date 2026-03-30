import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, Phone, MapPin, Calendar, 
  DollarSign, AlertCircle, ShoppingBag, Activity, 
  BrainCircuit, Search, Filter, LayoutGrid, List as ListIcon, 
  Settings2, Plus, X, Check, ArrowRight, Thermometer,
  TrendingUp, AlertTriangle, Zap, MessageCircle, Clock, Send,
  GripVertical, UserCheck, ShieldAlert, FileText, RotateCcw,
  Edit2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

// --- Helpers ---
const TemperatureBadge = ({ temp }) => {
    const config = {
        'Hot': { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Zap, label: 'Quente' },
        'Warm': { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Thermometer, label: 'Morno' },
        'Cold': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon:  Clock, label: 'Frio' },
        'At Risk': { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertTriangle, label: 'Em Risco' }
    };
    const style = config[temp] || config['Cold'];
    const Icon = style.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 border", style.color)}>
            <Icon className="w-3 h-3" /> {style.label}
        </Badge>
    );
};

const TagList = ({ items, colorClass, max = 3, emptyText = "N/A" }) => {
  if (!items || items.length === 0) return <span className="text-xs text-muted-foreground">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, max).map((item, i) => (
        <Badge key={i} variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${colorClass}`}>
          {item}
        </Badge>
      ))}
      {items.length > max && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-secondary text-secondary-foreground">
          +{items.length - max}
        </Badge>
      )}
    </div>
  );
};

// Task 2 & 5: Enhanced CopilotStatCard with AnimatedCounter
export const CopilotStatCard = ({ title, value, subtext, icon: Icon, trend, colorClass = "text-violet-400" }) => {
    // Determine if value is currency string or number
    const isCurrency = typeof value === 'string' && (value.includes('R$') || value.includes('$'));
    const numericValue = isCurrency 
        ? parseFloat(value.replace(/[^0-9,-]+/g,"").replace(",", ".")) 
        : (typeof value === 'number' ? value : parseFloat(value));

    // Formatter logic
    const formatter = (val) => {
        if (isCurrency) return formatCurrency(val);
        return Math.floor(val).toString();
    };

    return (
        <div className="bg-[#161922]/80 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all shadow-lg hover:shadow-xl">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                    {isNaN(numericValue) ? (
                        value
                    ) : (
                        <AnimatedCounter value={numericValue} formatter={formatter} />
                    )}
                </h3>
            </div>
            <div className="flex items-center mt-3 gap-2">
                 {trend !== undefined && (
                     <Badge variant="outline" className={cn("text-[10px] px-1 h-5 border-0 bg-white/5", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
                         {trend > 0 ? '+' : ''}{trend}%
                     </Badge>
                 )}
                 <span className="text-[10px] text-white/40 truncate">{subtext}</span>
            </div>
        </div>
    );
};

// --- Add Client Modal ---
export const AddClientModal = ({ isOpen, onClose, user, onClientAdded }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', cpf_cnpj: '', address: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            if (formData.cpf_cnpj && formData.cpf_cnpj.trim() !== '') {
                 const { data: existing, error: checkError } = await supabase.from('customers').select('id').eq('distributor_id', user.id).eq('cpf_cnpj', formData.cpf_cnpj.trim()).maybeSingle();
                 if (checkError) throw checkError;
                 if (existing) throw new Error("Este CPF/CNPJ já está cadastrado em sua carteira.");
            }
            const { data, error } = await supabase.from('customers').insert({ ...formData, distributor_id: user.id }).select().single();
            if (error) throw error;
            toast({ title: "Sucesso", description: "Cliente adicionado com sucesso." });
            onClientAdded(data);
            setFormData({ name: '', phone: '', cpf_cnpj: '', address: '' });
            onClose();
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally { setLoading(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#161922] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <DialogDescription className="text-white/60">Crie um novo registro de cliente para começar a coletar inteligência.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-white/80">Nome Completo</Label>
                        <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-[#0B0E14] border-white/10 text-white" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white/80">Telefone</Label>
                            <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-[#0B0E14] border-white/10 text-white" placeholder="(00) 00000-0000"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-white/80">CPF/CNPJ</Label>
                            <Input id="cpf" value={formData.cpf_cnpj} onChange={e => setFormData({...formData, cpf_cnpj: e.target.value})} className="bg-[#0B0E14] border-white/10 text-white" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">{loading ? 'Salvando...' : 'Salvar Cliente'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// --- View: Grid Card ---
export const ClientCard = ({ client, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={() => onClick(client)}
      className="group relative bg-[#161922]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 cursor-pointer overflow-hidden shadow-lg hover:shadow-violet-900/20 transition-all flex flex-col justify-between h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {client.isOverridden && (
          <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-violet-500/30 text-violet-300 bg-violet-500/10">Editado</Badge>
          </div>
      )}
      
      {/* Header */}
      <div>
        <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                    <AvatarFallback className="bg-violet-900/50 text-violet-200 text-xs">{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold text-white text-sm truncate max-w-[140px]">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/40 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> {client.lastContact ? formatDate(client.lastContact) : 'Sem contato'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-8"><TemperatureBadge temp={client.temperature} /></div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <p className="text-[9px] text-white/40 uppercase">Potencial</p>
                <div className="text-xs font-bold text-violet-400">
                    <AnimatedCounter value={client.revenuePotential} formatter={formatCurrency} />
                </div>
            </div>
             <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                <p className="text-[9px] text-white/40 uppercase">Score</p>
                <div className="flex items-center gap-1">
                    <div className="text-xs font-bold text-white">
                        <AnimatedCounter value={client.leadScore || 0} />
                    </div>
                    <span className="text-[9px] text-white/30">/100</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-2">
             {/* Intelligent Rec */}
             {client.nextBestAction && (
                 <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2 flex items-start gap-2">
                     <BrainCircuit className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                     <div>
                         <p className="text-[10px] font-bold text-violet-300 uppercase">Sugestão</p>
                         <p className="text-xs text-white/80 leading-tight line-clamp-2">{client.nextBestAction}</p>
                     </div>
                 </div>
             )}

            {client.pathologies && client.pathologies.length > 0 && (
                <div className="flex items-center gap-2 overflow-hidden">
                   <Activity className="w-3 h-3 text-pink-500 shrink-0"/>
                   <TagList items={client.pathologies} colorClass="bg-pink-500/10 text-pink-400" max={2} />
                </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center relative z-10">
         <div className="flex items-center text-[10px] text-white/50">
            <ShoppingBag className="w-3 h-3 mr-1 text-cyan-500/70" />
            {client.products.length} Produtos
         </div>
         <Button variant="ghost" size="sm" className="h-6 text-[10px] hover:bg-white/10 text-white/70 group-hover:text-violet-300 transition-colors">
            Ver Detalhes <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform"/>
         </Button>
      </div>
    </motion.div>
  );
};

// --- View: Kanban Board ---
export const CopilotKanbanBoard = ({ clients, onCardClick }) => {
    const columns = {
        'Hot': { title: 'Oportunidades Quentes', color: 'border-red-500/50 bg-red-500/5', items: [] },
        'Warm': { title: 'Em Aquecimento', color: 'border-amber-500/50 bg-amber-500/5', items: [] },
        'Cold': { title: 'Contatos Frios', color: 'border-blue-500/50 bg-blue-500/5', items: [] },
        'At Risk': { title: 'Em Risco (Churn)', color: 'border-rose-500/50 bg-rose-500/5', items: [] }
    };
    clients.forEach(c => {
        if (columns[c.temperature]) columns[c.temperature].items.push(c);
        else columns['Cold'].items.push(c);
    });
    return (
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
            {Object.entries(columns).map(([key, col]) => (
                <div key={key} className="flex-1 min-w-[300px] flex flex-col bg-[#0B0E14]/30 rounded-xl border border-white/5 h-full">
                    <div className={`p-3 border-b border-white/5 flex justify-between items-center ${col.color.split(' ')[1]} rounded-t-xl`}>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                           <TemperatureBadge temp={key} /> <span className="ml-1">{col.items.length}</span>
                        </h3>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                            {col.items.length === 0 ? <div className="h-24 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-xs text-white/30 italic">Vazio</div> : col.items.map(client => (
                                <div key={client.id} onClick={() => onCardClick(client)} className="cursor-pointer">
                                     <div className="bg-[#161922] border border-white/5 hover:border-violet-500/50 p-3 rounded-lg shadow-sm transition-all group relative">
                                        {client.isOverridden && <div className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full" />}
                                         <div className="flex justify-between items-start mb-2">
                                             <span className="font-bold text-white text-sm truncate">{client.name}</span>
                                             <span className="text-[10px] font-mono text-emerald-400">
                                                 <AnimatedCounter value={client.revenuePotential} formatter={formatCurrency} />
                                             </span>
                                         </div>
                                         {client.nextBestAction && <div className="text-[10px] text-white/60 bg-white/5 p-1.5 rounded flex items-start gap-1.5 mb-2"><BrainCircuit className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" /><span className="leading-tight">{client.nextBestAction}</span></div>}
                                         <div className="flex justify-between items-center text-[10px] text-white/40">
                                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {client.lastContact ? formatDate(client.lastContact) : 'N/A'}</span>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            ))}
        </div>
    );
};

// --- View: Table Row ---
export const ClientTableRow = ({ client, columns, onClick }) => {
  return (
    <TableRow className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group" onClick={() => onClick(client)}>
      {columns.find(c => c.id === 'name' && c.visible) && (
        <TableCell className="font-medium text-white">
             <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-white/5">
                    <AvatarFallback className="text-[10px] bg-white/5 text-white/60">{client.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="text-sm">{client.name} {client.isOverridden && <span className="text-[9px] text-violet-400 ml-1">(Editado)</span>}</div>
                    <div className="text-[10px] text-white/30">{client.city}</div>
                </div>
             </div>
        </TableCell>
      )}
      {/* ... other cells same as before ... */}
      {columns.find(c => c.id === 'temperature' && c.visible) && <TableCell><TemperatureBadge temp={client.temperature} /></TableCell>}
      {columns.find(c => c.id === 'score' && c.visible) && <TableCell><div className="flex items-center gap-1"><div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${client.leadScore > 70 ? 'bg-emerald-500' : client.leadScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${client.leadScore}%` }}/></div><span className="text-xs text-white/60">{client.leadScore}</span></div></TableCell>}
      {columns.find(c => c.id === 'next_action' && c.visible) && <TableCell className="max-w-[200px]"><div className="flex items-center gap-2 text-xs text-violet-300"><BrainCircuit className="w-3 h-3 shrink-0" /><span className="truncate">{client.nextBestAction}</span></div></TableCell>}
      {columns.find(c => c.id === 'ltv' && c.visible) && <TableCell className="text-emerald-400 font-mono text-xs font-medium">{formatCurrency(client.ltv)}</TableCell>}
      {columns.find(c => c.id === 'potential' && c.visible) && <TableCell className="text-violet-400 font-mono text-xs">{formatCurrency(client.revenuePotential)}</TableCell>}
      {columns.find(c => c.id === 'last_contact' && c.visible) && <TableCell className="text-white/60 text-xs">{client.lastContact ? formatDate(client.lastContact) : '-'}</TableCell>}
      <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white"><ArrowRight className="w-4 h-4"/></Button></TableCell>
    </TableRow>
  );
};

// --- Chart Component ---
export const RevenueForecastChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="flex items-center justify-center h-[250px] text-white/30 text-sm border border-dashed border-white/10 rounded-xl">Sem dados suficientes para projeção</div>;
    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="period" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#ffffff40" fontSize={10} tickFormatter={(value) => `${value/1000}k`} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{ backgroundColor: '#161922', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff' }} formatter={(value) => [formatCurrency(value), 'Receita Projetada']}/>
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Detailed Modal with EDIT capabilities ---
export const ClientDetailModal = ({ client, isOpen, onClose, recommendations, onSave, onReset }) => {
    const [editMode, setEditMode] = useState(false);
    const [editedValues, setEditedValues] = useState({});
    const [newPathology, setNewPathology] = useState('');

    useEffect(() => {
        if (client) {
            setEditedValues({
                revenuePotential: client.revenuePotential,
                leadScore: client.leadScore,
                temperature: client.temperature,
                pathologies: client.pathologies || []
            });
        }
        setEditMode(false);
    }, [client]);

    if (!client) return null;

    const handleSave = () => {
        onSave(client.id, editedValues);
        setEditMode(false);
    };

    const handleReset = () => {
        onReset(client.id);
        setEditMode(false);
    };

    const handleAddPathology = () => {
        if (newPathology.trim() && !editedValues.pathologies.includes(newPathology.trim())) {
            setEditedValues(prev => ({ ...prev, pathologies: [...prev.pathologies, newPathology.trim()] }));
            setNewPathology('');
        }
    };

    const handleRemovePathology = (path) => {
        setEditedValues(prev => ({ ...prev, pathologies: prev.pathologies.filter(p => p !== path) }));
    };

    // Task 3: WhatsApp Integration
    const handleQuickAction = (actionName) => {
        toast({
            title: "Ação Iniciada",
            description: `${actionName} para ${client.name} - Processando...`,
            variant: "default",
        });
        
        if (actionName === 'WhatsApp') {
            const phone = client.phone?.replace(/\D/g, '');
            if (!phone) {
                toast({ title: "Erro", description: "Cliente sem telefone cadastrado.", variant: "destructive" });
                return;
            }
            // Add '55' if it's a Brazilian number missing country code (11 digits usually)
            const formattedPhone = (phone.length === 10 || phone.length === 11) ? `55${phone}` : phone;
            
            const recommendationText = client.nextBestAction 
                ? `Tenho uma recomendação especial para você: ${client.nextBestAction}` 
                : "Gostaria de saber como você está.";
                
            const message = encodeURIComponent(`Olá ${client.name}! ${recommendationText}`);
            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
        } else if (actionName === 'Agendamento') {
             // Future implementation
             toast({ title: "Agendamento", description: "Funcionalidade de calendário será aberta." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#0B0E14] border-white/10 text-white rounded-[2rem] overflow-hidden p-0 max-h-[90vh] flex flex-col shadow-2xl shadow-violet-900/20">
                {/* Header with Cover */}
                <div className="relative h-40 bg-gradient-to-r from-violet-950/80 via-[#0B0E14] to-cyan-950/80 border-b border-white/5 shrink-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80')] opacity-10 mix-blend-screen bg-cover bg-center" />
                    
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                         {client.isOverridden && !editMode && (
                             <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 hover:bg-violet-500/30">Editado Manualmente</Badge>
                         )}
                         <TemperatureBadge temp={editMode ? editedValues.temperature : client.temperature} />
                    </div>

                    <div className="absolute -bottom-10 left-8 flex items-end gap-6 z-10">
                        <Avatar className="h-24 w-24 border-4 border-[#0B0E14] shadow-xl ring-2 ring-white/10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                            <AvatarFallback className="bg-violet-600 text-2xl">{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="mb-3">
                             <h2 className="text-3xl font-bold text-white shadow-sm flex items-center gap-2">
                                 {client.name}
                             </h2>
                             <div className="flex flex-wrap gap-4 text-xs text-white/60 mt-1">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                    <MapPin className="w-3 h-3"/> {client.city || 'Local n/a'}
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                    <Phone className="w-3 h-3"/> {client.phone || 'Tel n/a'}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12">
                    <div className="flex justify-end mb-4">
                        {!editMode ? (
                            <div className="flex gap-2">
                                {client.isOverridden && (
                                    <Button variant="outline" size="sm" onClick={handleReset} className="border-white/10 text-white hover:bg-white/5">
                                        <RotateCcw className="w-3 h-3 mr-2" /> Restaurar IA
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                                    <Edit2 className="w-3 h-3 mr-2" /> Editar Avaliação
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 bg-[#161922] p-1 rounded-lg border border-white/10">
                                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)} className="text-white/60 hover:text-white">Cancelar</Button>
                                <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="w-3 h-3 mr-2"/> Salvar Alterações</Button>
                            </div>
                        )}
                    </div>

                    {/* Top Stats - Editable */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[#161922] p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase font-bold">LTV Total (Real)</p>
                            <div className="text-xl font-bold text-emerald-400 mt-1">
                                <AnimatedCounter value={client.ltv} formatter={formatCurrency} />
                            </div>
                        </div>
                        
                        <div className={`bg-[#161922] p-4 rounded-xl border ${editMode ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5'}`}>
                            <p className="text-[10px] text-white/40 uppercase font-bold">Potencial Estimado</p>
                            {editMode ? (
                                <Input 
                                    type="number" 
                                    value={editedValues.revenuePotential} 
                                    onChange={(e) => setEditedValues({...editedValues, revenuePotential: Number(e.target.value)})}
                                    className="h-7 mt-1 bg-[#0B0E14] border-white/10 text-violet-400 font-bold"
                                />
                            ) : (
                                <div className="text-xl font-bold text-violet-400 mt-1">
                                    <AnimatedCounter value={client.revenuePotential} formatter={formatCurrency} />
                                </div>
                            )}
                        </div>
                        
                        <div className={`bg-[#161922] p-4 rounded-xl border ${editMode ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5'}`}>
                            <p className="text-[10px] text-white/40 uppercase font-bold">Lead Score</p>
                            {editMode ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <Slider 
                                        defaultValue={[editedValues.leadScore]} 
                                        max={100} step={1} 
                                        onValueChange={(val) => setEditedValues({...editedValues, leadScore: val[0]})}
                                        className="w-full"
                                    />
                                    <span className="text-sm font-bold w-8 text-right">{editedValues.leadScore}</span>
                                </div>
                            ) : (
                                <div className="flex items-center mt-1">
                                    <span className="text-xl font-bold text-white"><AnimatedCounter value={client.leadScore} /></span>
                                    <span className="text-xs text-white/40 font-normal">/100</span>
                                </div>
                            )}
                        </div>
                        
                        <div className={`bg-[#161922] p-4 rounded-xl border ${editMode ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5'}`}>
                             <p className="text-[10px] text-white/40 uppercase font-bold">Temperatura</p>
                             {editMode ? (
                                 <Select value={editedValues.temperature} onValueChange={(val) => setEditedValues({...editedValues, temperature: val})}>
                                     <SelectTrigger className="h-7 mt-1 bg-[#0B0E14] border-white/10 text-xs"><SelectValue /></SelectTrigger>
                                     <SelectContent className="bg-[#161922] border-white/10 text-white">
                                         {['Hot', 'Warm', 'Cold', 'At Risk'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                     </SelectContent>
                                 </Select>
                             ) : (
                                 <div className="mt-1"><TemperatureBadge temp={client.temperature} /></div>
                             )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Actions Panel */}
                            <div className="bg-[#161922] border border-white/5 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-violet-400"/> Ações Rápidas
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Button onClick={() => handleQuickAction('WhatsApp')} variant="outline" className="h-20 flex-col gap-2 border-white/5 bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/30 group">
                                        <MessageCircle className="w-6 h-6 text-white/60 group-hover:text-emerald-400"/>
                                        <span className="text-xs text-white/60 group-hover:text-white">WhatsApp</span>
                                    </Button>
                                    <Button onClick={() => handleQuickAction('Agendamento')} variant="outline" className="h-20 flex-col gap-2 border-white/5 bg-white/[0.02] hover:bg-blue-500/10 hover:border-blue-500/30 group">
                                        <Calendar className="w-6 h-6 text-white/60 group-hover:text-blue-400"/>
                                        <span className="text-xs text-white/60 group-hover:text-white">Agendar</span>
                                    </Button>
                                    <Button onClick={() => handleQuickAction('Proposta')} variant="outline" className="h-20 flex-col gap-2 border-white/5 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 group">
                                        <FileText className="w-6 h-6 text-white/60 group-hover:text-violet-400"/>
                                        <span className="text-xs text-white/60 group-hover:text-white">Proposta</span>
                                    </Button>
                                    <Button onClick={() => handleQuickAction('Nota')} variant="outline" className="h-20 flex-col gap-2 border-white/5 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/30 group">
                                        <Edit2 className="w-6 h-6 text-white/60 group-hover:text-amber-400"/>
                                        <span className="text-xs text-white/60 group-hover:text-white">Nota</span>
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Copilot Insight Box */}
                            <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden">
                                 <h4 className="text-lg font-bold text-violet-100 flex items-center gap-2 mb-4 relative z-10">
                                    <BrainCircuit className="w-5 h-5 text-violet-400"/> Sales Copilot Intelligence
                                 </h4>
                                 <div className="space-y-4 relative z-10">
                                    <div className="bg-[#0B0E14]/40 backdrop-blur-sm p-4 rounded-xl border border-violet-500/20">
                                        <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">Próxima Melhor Ação</p>
                                        <h5 className="text-lg font-bold text-white mb-2">{client.nextBestAction}</h5>
                                    </div>
                                    {recommendations.length > 0 && (
                                        <div className="grid gap-2">
                                            <p className="text-xs font-bold text-white/40 uppercase ml-1">Sugestões de Produtos</p>
                                            {recommendations.map((rec, idx) => (
                                                <div key={idx} className="bg-[#0B0E14]/30 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ShoppingBag className="w-4 h-4 text-cyan-400"/>
                                                        <div><p className="text-sm font-medium text-white">{rec.productName}</p><p className="text-[10px] text-white/50">{rec.reason}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                 </div>
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="space-y-6">
                            <div className={`bg-[#161922] p-5 rounded-xl border ${editMode ? 'border-violet-500/50' : 'border-white/5'}`}>
                                <h4 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-wider flex items-center gap-2">
                                    <Activity className="w-3 h-3"/> Patologias & Interesses
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(editMode ? editedValues.pathologies : client.pathologies).length > 0 ? (
                                        (editMode ? editedValues.pathologies : client.pathologies).map((p,i) => (
                                            <Badge key={i} className="bg-pink-500/10 text-pink-300 border-pink-500/20 pr-1">
                                                {p}
                                                {editMode && <button onClick={() => handleRemovePathology(p)} className="ml-1 hover:text-white"><X className="w-3 h-3"/></button>}
                                            </Badge>
                                        ))
                                    ) : ( <span className="text-xs text-white/30 italic">Nenhuma registrada</span>)}
                                </div>
                                {editMode && (
                                    <div className="flex gap-2 mt-4">
                                        <Input 
                                            value={newPathology}
                                            onChange={(e) => setNewPathology(e.target.value)}
                                            placeholder="Adicionar patologia..."
                                            className="h-8 text-xs bg-[#0B0E14] border-white/10"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddPathology()}
                                        />
                                        <Button size="sm" onClick={handleAddPathology} className="h-8 w-8 p-0 bg-pink-600 hover:bg-pink-700"><Plus className="w-4 h-4"/></Button>
                                    </div>
                                )}
                            </div>
                             <div className="bg-[#161922] p-5 rounded-xl border border-white/5">
                                <h4 className="text-xs font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-cyan-400"/> Arsenal Adquirido</h4>
                                {client.products.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {client.products.map((prod, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-cyan-950/30 text-cyan-400 border border-cyan-900/50">{prod}</Badge>
                                        ))}
                                    </div>
                                ) : <div className="text-xs text-white/30 italic">Nenhum produto.</div>}
                             </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-6 border-t border-white/5 bg-[#161922] flex justify-between items-center w-full">
                     <div className="text-xs text-white/30 hidden sm:block">ID: {client.id.substring(0,8)}</div>
                     <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/5">Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};