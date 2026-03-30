import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, RefreshCw, FileJson, Download } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const WebhookExecutionLogsComponent = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('webhook_execution_logs')
                .select(`
                    *,
                    distributor_webhooks!inner (
                        distributor_id,
                        name
                    )
                `)
                .eq('distributor_webhooks.distributor_id', user?.id)
                .order('executed_at', { ascending: false })
                .limit(50);

            if (searchTerm) {
                // Client-side filtering for simplicity in this context, 
                // or we could add .ilike('distributor_webhooks.name', `%${searchTerm}%`) if supported by the join
            }
            
            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLogs();
    }, [user]);

    const getStatusBadge = (status, code) => {
        if (status === 'success' || (code >= 200 && code < 300)) {
            return <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20">Sucesso ({code})</Badge>;
        }
        return <Badge variant="destructive">Falha ({code || 'Error'})</Badge>;
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex gap-2 w-full sm:max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por webhook..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Filtrar Data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchLogs}>
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Webhook</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhum log encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                                    <TableCell className="font-mono text-xs">
                                        {log.executed_at ? new Date(log.executed_at).toLocaleString() : '-'}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.distributor_webhooks?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(log.status, log.response_status)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {log.execution_time_ms ? `${log.execution_time_ms}ms` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                                            <FileJson className="h-4 w-4 text-blue-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Execução</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Webhook</span>
                                    <span className="font-medium">{selectedLog.distributor_webhooks?.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Data</span>
                                    <span className="font-mono">{selectedLog.executed_at ? new Date(selectedLog.executed_at).toLocaleString() : '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Status Code</span>
                                    <span className="font-mono">{selectedLog.response_status}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Tentativa</span>
                                    <span className="font-mono">{selectedLog.retry_attempt || 0}</span>
                                </div>
                            </div>
                            
                            {selectedLog.error_message && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md text-red-400 text-sm">
                                    <strong>Erro:</strong> {selectedLog.error_message}
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Request Payload</h4>
                                <pre className="bg-slate-950 p-3 rounded-md text-xs font-mono overflow-auto max-h-40">
                                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Response Body</h4>
                                <pre className="bg-slate-950 p-3 rounded-md text-xs font-mono overflow-auto max-h-40">
                                    {JSON.stringify(selectedLog.response_body, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WebhookExecutionLogsComponent;