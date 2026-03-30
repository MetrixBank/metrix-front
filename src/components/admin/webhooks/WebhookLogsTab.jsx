import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const WebhookLogsTab = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Updated to use webhook_execution_logs and join with distributor_webhooks for filtering
            const { data, error } = await supabase
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

            if (error) {
                console.error('Error fetching logs:', error);
            } else {
                setLogs(data || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLogs();
    }, [user]);

    return (
        <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-white">Histórico de Execuções</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-950">
                            <TableRow>
                                <TableHead className="text-slate-400">Data/Hora</TableHead>
                                <TableHead className="text-slate-400">Webhook</TableHead>
                                <TableHead className="text-slate-400">Status</TableHead>
                                <TableHead className="text-slate-400">Tentativa</TableHead>
                                <TableHead className="text-right text-slate-400">Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="border-b border-slate-800 hover:bg-slate-900/80">
                                        <TableCell className="font-mono text-xs">
                                            {log.executed_at ? format(new Date(log.executed_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {log.distributor_webhooks?.name || 'Webhook Removido'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.status === 'success' || (log.response_status >= 200 && log.response_status < 300) ? (
                                                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Sucesso
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
                                                        <XCircle className="w-3 h-3 mr-1" /> Erro
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-slate-500">({log.response_status})</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {log.retry_attempt || 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                                                        <Eye className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Detalhes da Execução</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-slate-500 block">ID do Log</span>
                                                                <span className="font-mono text-xs">{selectedLog?.id}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 block">Data</span>
                                                                <span>{selectedLog?.executed_at && format(new Date(selectedLog.executed_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 block">Webhook</span>
                                                                <span className="font-mono">{selectedLog?.distributor_webhooks?.name}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 block">Status Code</span>
                                                                <span className={(selectedLog?.response_status >= 200 && selectedLog?.response_status < 300) ? 'text-green-400' : 'text-red-400'}>
                                                                    {selectedLog?.response_status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {selectedLog?.error_message && (
                                                            <div className="bg-red-950/30 p-3 rounded border border-red-900">
                                                                <span className="text-red-400 text-xs font-bold block mb-1">ERRO:</span>
                                                                <p className="text-red-300 text-sm">{selectedLog.error_message}</p>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <span className="text-slate-500 block mb-2">Payload Enviado (JSON)</span>
                                                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-auto max-h-[200px]">
                                                                <pre className="text-xs font-mono text-blue-400 whitespace-pre-wrap">
                                                                    {JSON.stringify(selectedLog?.request_payload, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <span className="text-slate-500 block mb-2">Resposta Recebida (JSON)</span>
                                                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-auto max-h-[200px]">
                                                                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                                                                    {JSON.stringify(selectedLog?.response_body, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default WebhookLogsTab;