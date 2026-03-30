import React, { useState } from 'react';
import { 
  CalendarDays, CheckCircle2, Clock, DollarSign, Filter, Search, User, XCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const TeamActivitiesSection = ({ activities = [], distributors = [], loading }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [memberFilter, setMemberFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActivities = activities.filter(activity => {
        const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
        const matchesMember = memberFilter === 'all' || activity.distributor_id === memberFilter;
        const matchesSearch = activity.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              activity.activity_type?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesMember && matchesSearch;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'sale_made': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Venda' };
            case 'visit_made': return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: User, label: 'Visita' };
            case 'scheduled': return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: CalendarDays, label: 'Agendado' };
            case 'lost': return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Perdido' };
            default: return { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Clock, label: status };
        }
    };

    const getDistributorInfo = (id) => {
        return distributors.find(d => d.id === id) || { name: 'Desconhecido', avatar_url: null };
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-40 rounded-xl bg-slate-800/50" />
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                <Clock className="w-12 h-12 text-slate-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-300">Nenhuma atividade recente</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2">
                    As atividades da sua equipe aparecerão aqui assim que forem registradas ou filtradas.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por cliente ou tipo..." 
                        className="pl-9 bg-slate-950 border-slate-700 focus:border-emerald-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px] bg-slate-950 border-slate-700">
                        <Filter className="w-4 h-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="sale_made">Vendas</SelectItem>
                        <SelectItem value="visit_made">Visitas</SelectItem>
                        <SelectItem value="scheduled">Agendados</SelectItem>
                        <SelectItem value="lost">Perdidos</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="w-full md:w-[200px] bg-slate-950 border-slate-700">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Membro" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="all">Todos Membros</SelectItem>
                        {distributors.map(dist => (
                            <SelectItem key={dist.id} value={dist.id}>{dist.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActivities.map((activity) => {
                    const statusConfig = getStatusConfig(activity.status);
                    const StatusIcon = statusConfig.icon;
                    const distributor = getDistributorInfo(activity.distributor_id);

                    return (
                        <Card key={activity.id} className="bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all group">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-slate-200 line-clamp-1" title={activity.customer_name}>
                                            {activity.customer_name}
                                        </h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            {activity.visit_date ? format(new Date(activity.visit_date), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Data N/A'}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1 px-2 py-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Tipo:</span>
                                        <span className="text-slate-300 font-medium">{activity.activity_type || 'Geral'}</span>
                                    </div>
                                    {activity.sale_value > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400">Valor:</span>
                                            <span className="text-emerald-400 font-bold">{formatCurrency(activity.sale_value)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 border border-slate-700">
                                            <AvatarImage src={distributor.avatar_url} />
                                            <AvatarFallback className="text-[10px] bg-slate-800 text-slate-400">
                                                {distributor.name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-slate-400 truncate max-w-[100px]">
                                            {distributor.name}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-white px-2">
                                        Detalhes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            
            {filteredActivities.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    Nenhuma atividade encontrada com os filtros atuais.
                </div>
            )}
        </div>
    );
};

export default TeamActivitiesSection;