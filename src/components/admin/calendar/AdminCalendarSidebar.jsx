import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Filter, DollarSign, Briefcase } from 'lucide-react';
import { format, isSameDay, addDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const AdminCalendarSidebar = ({ 
    filters, 
    onFilterChange, 
    upcomingEvents, 
    distributors 
}) => {
    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Filters Card */}
            <Card className="bg-slate-900/50 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Buscar</Label>
                        <Input 
                            placeholder="Cliente ou atividade..." 
                            value={filters.searchQuery}
                            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                            className="h-8 bg-slate-800 border-slate-700 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Distribuidor</Label>
                        <Select 
                            value={filters.distributorId} 
                            onValueChange={(val) => onFilterChange('distributorId', val)}
                        >
                            <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-xs">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Todos</SelectItem>
                                {distributors.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="showFinancials" 
                            checked={filters.showFinancials}
                            onCheckedChange={(checked) => onFilterChange('showFinancials', checked)}
                            className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <Label htmlFor="showFinancials" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300">
                            Exibir Financeiro
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-slate-900/50 border-white/10 flex-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 bg-slate-800/50">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-400" /> Próximos 7 Dias
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 px-4 py-2">
                    <div className="space-y-4">
                        {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                            const date = addDays(new Date(), offset);
                            const dayEvents = upcomingEvents.filter(e => isSameDay(e.start, date));
                            
                            if (dayEvents.length === 0) return null;

                            return (
                                <div key={offset} className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">
                                        {offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : format(date, "EEEE, dd/MM", { locale: ptBR })}
                                    </h4>
                                    <div className="space-y-2">
                                        {dayEvents.map(evt => (
                                            <div key={evt.id} className={`p-2 rounded border-l-2 text-xs bg-slate-800/50 ${
                                                evt.type === 'financial' 
                                                    ? evt.subType === 'income' ? 'border-emerald-500' : 'border-red-500'
                                                    : 'border-blue-500'
                                            }`}>
                                                <div className="font-medium text-slate-200 truncate">{evt.title}</div>
                                                <div className="flex justify-between mt-1 text-slate-500">
                                                    <span>{evt.allDay ? 'Dia todo' : format(evt.start, 'HH:mm')}</span>
                                                    {evt.type === 'activity' && <span className="text-[10px]">{evt.resource.activity_type}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {upcomingEvents.length === 0 && (
                            <p className="text-center text-xs text-slate-500 py-4">Nenhum evento próximo.</p>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Legend */}
            <Card className="bg-slate-900/50 border-white/10">
                <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Venda</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Visita</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Follow-up</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Pendente</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-600"></div> Receita</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Despesa</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCalendarSidebar;