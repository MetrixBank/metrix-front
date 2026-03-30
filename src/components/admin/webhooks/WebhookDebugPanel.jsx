import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, RefreshCw, AlertTriangle, CheckCircle, Code } from 'lucide-react';
import { format } from 'date-fns';
import { DataExtractor } from '@/lib/webhook/DataExtractor';
import { useAuth } from '@/hooks/useAuth';

const WebhookDebugPanel = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('webhook_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            // Filter by distributor if not admin? 
            // Assuming this component is used in a context where RLS handles visibility
            // or the user wants to see their own logs.
            
            const { data, error } = await query;
            if (error) throw error;
            setLogs(data);
            if (data.length > 0 && !selectedLog) setSelectedLog(data[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleReprocess = (log) => {
        // Run the client-side processor to see what it *would* extract now
        // This is useful for debugging parser improvements
        const freshExtraction = DataExtractor.process(log.raw_data);
        alert(JSON.stringify(freshExtraction, null, 2));
    };

    const filteredLogs = logs.filter(log => {
        const term = searchTerm.toLowerCase();
        const rawString = JSON.stringify(log.raw_data).toLowerCase();
        const name = log.extracted_data?.contact?.name?.toLowerCase() || '';
        const phone = log.extracted_data?.contact?.phone?.toLowerCase() || '';
        return rawString.includes(term) || name.includes(term) || phone.includes(term);
    });

    return (
        <div className="flex h-[calc(100vh-200px)] gap-4">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar logs..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchLogs}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                
                <Card className="flex-1 overflow-hidden border-slate-200 dark:border-slate-800">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredLogs.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedLog?.id === log.id ? 'bg-slate-50 dark:bg-slate-800 border-l-4 border-primary' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[10px] h-5 px-1.5">
                                            {log.status === 'success' ? 'SUCESSO' : 'ERRO'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(log.created_at), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    <div className="font-medium text-sm truncate">
                                        {log.extracted_data?.contact?.name || 'Desconhecido'}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {log.extracted_data?.contact?.phone || 'Sem telefone'}
                                    </div>
                                </button>
                            ))}
                            {filteredLogs.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhum log encontrado</div>}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Detail View */}
            <div className="w-2/3">
                {selectedLog ? (
                    <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800">
                        <CardHeader className="flex-row justify-between items-center border-b py-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Detalhes do Webhook
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                        selectedLog.confidence_score > 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                        selectedLog.confidence_score > 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        Confiança: {selectedLog.confidence_score}%
                                    </span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">ID: {selectedLog.id}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleReprocess(selectedLog)}>
                                <Code className="h-4 w-4 mr-2" />
                                Testar Extração Local
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            <div className="grid grid-cols-2 h-full divide-x">
                                {/* Processed Data */}
                                <div className="p-4 space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Dados Extraídos
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Contato</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Nome:</span>
                                                    <p className="font-medium">{selectedLog.extracted_data?.contact?.name || '-'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-xs">Telefone:</span>
                                                    <p className="font-medium">{selectedLog.extracted_data?.contact?.phone || '-'}</p>
                                                </div>
                                            </div>
                                            {selectedLog.extracted_data?.contact?.validation_errors?.length > 0 && (
                                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                                    ⚠️ {selectedLog.extracted_data.contact.validation_errors.join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mensagem</p>
                                            <p className="text-sm italic text-slate-600 dark:text-slate-300 mb-2">
                                                "{selectedLog.extracted_data?.message?.content}"
                                            </p>
                                            <div className="flex gap-2 text-xs">
                                                <Badge variant="outline">{selectedLog.extracted_data?.message?.analysis?.sentiment}</Badge>
                                                <Badge variant="outline">{selectedLog.extracted_data?.message?.analysis?.intent}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Raw JSON */}
                                <div className="p-4 bg-slate-50/50 dark:bg-black/20 flex flex-col">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300">
                                        <Code className="h-4 w-4 text-blue-500" />
                                        Raw Payload
                                    </h4>
                                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all flex-1 overflow-auto">
                                        {JSON.stringify(selectedLog.raw_data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center border rounded-lg border-dashed text-muted-foreground bg-slate-50/50">
                        Selecione um log para ver os detalhes
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebhookDebugPanel;