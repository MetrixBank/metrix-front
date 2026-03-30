import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { activityTypeLabels, activityTypeColors } from '@/lib/constants';
import { getStatusPortuguese } from '@/lib/utils';

const ConsolidatedActivitiesTab = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                // Fetch latest 50 activities for now
                const { data, error } = await supabase
                    .from('sales_opportunities')
                    .select(`
                        *,
                        profiles:distributor_id (name, avatar_url)
                    `)
                    .order('visit_date', { ascending: false })
                    .limit(50);
                
                if (error) throw error;
                setActivities(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    const filtered = activities.filter(a => {
        const matchesSearch = a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              a.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || a.activity_type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <Card className="bg-[#161922] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Central de Atividades</CardTitle>
                <div className="flex gap-2">
                    <div className="relative w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                         <Input 
                            placeholder="Buscar cliente ou distribuidor..." 
                            className="pl-10 bg-[#0B0E14] border-white/10 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                         <SelectTrigger className="w-[180px] bg-[#0B0E14] border-white/10 text-white">
                             <SelectValue placeholder="Tipo de Atividade" />
                         </SelectTrigger>
                         <SelectContent className="bg-[#1A1D26] border-white/10 text-white">
                             <SelectItem value="all">Todas</SelectItem>
                             {Object.entries(activityTypeLabels).map(([key, label]) => (
                                 <SelectItem key={key} value={key}>{label}</SelectItem>
                             ))}
                         </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader className="bg-[#0B0E14]">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-slate-400">Data</TableHead>
                            <TableHead className="text-slate-400">Distribuidor</TableHead>
                            <TableHead className="text-slate-400">Cliente</TableHead>
                            <TableHead className="text-slate-400">Tipo</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((activity) => (
                            <TableRow key={activity.id} className="border-white/5 hover:bg-white/5">
                                <TableCell className="text-white">{format(new Date(activity.visit_date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-white font-medium">{activity.profiles?.name || 'Unknown'}</TableCell>
                                <TableCell className="text-slate-300">{activity.customer_name}</TableCell>
                                <TableCell>
                                     <Badge variant="secondary" className={`${activityTypeColors[activity.activity_type] || 'bg-slate-100 text-slate-800'}`}>
                                        {activityTypeLabels[activity.activity_type] || activity.activity_type}
                                     </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm capitalize">{getStatusPortuguese(activity.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default ConsolidatedActivitiesTab;