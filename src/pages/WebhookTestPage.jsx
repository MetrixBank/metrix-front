import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Terminal, Send, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import WebhookLogsTab from '@/components/admin/webhooks/WebhookLogsTab';

const WebhookTestPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [testLoading, setTestLoading] = useState(false);
    const [testResponse, setTestResponse] = useState(null);

    // Default test payload
    const [payload, setPayload] = useState(JSON.stringify({
        "nome": "Cliente Teste",
        "telefone": "5511999999999",
        "mensagem": "Olá, gostaria de saber mais sobre o produto.",
        "origem": "conexzap",
        "funnel": "sales",
        "status": "novo"
    }, null, 2));

    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://[YOUR-PROJECT].supabase.co'}/functions/v1/webhook-conexzap-receiver`;
    
    const curlCommand = `curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-distributor-id: ${user?.id || 'YOUR_DISTRIBUTOR_ID'}' \\
  -d '${payload.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado para a área de transferência!" });
    };

    const handleTestSend = async () => {
        if (!user) {
            toast({ title: "Erro", description: "Você precisa estar logado para testar.", variant: "destructive" });
            return;
        }

        setTestLoading(true);
        setTestResponse(null);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-distributor-id': user.id
                },
                body: payload
            });

            const data = await response.json();
            setTestResponse({
                status: response.status,
                data: data
            });

            if (response.ok) {
                toast({ title: "Webhook enviado com sucesso!", className: "bg-green-600 text-white" });
            } else {
                toast({ title: "Erro no envio", description: data.error, variant: "destructive" });
            }

        } catch (error) {
            setTestResponse({
                status: 'Network Error',
                data: { error: error.message }
            });
            toast({ title: "Erro de rede", variant: "destructive" });
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Integração Webhook ConexZap</h1>
                        <p className="text-slate-400">Documentação e Ferramenta de Teste</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Documentation Column */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-indigo-400" /> 
                                    Endpoint
                                </CardTitle>
                                <CardDescription>Detalhes da URL para configuração no ConexZap</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-400">URL do Webhook (POST)</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={webhookUrl} className="bg-slate-950 border-slate-700 text-green-400 font-mono text-sm" />
                                        <Button variant="outline" size="icon" onClick={() => handleCopy(webhookUrl)}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400">Cabeçalhos Obrigatórios</Label>
                                    <div className="bg-slate-950 p-4 rounded-md border border-slate-800 text-sm font-mono space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">Content-Type</span>
                                            <span className="text-slate-300">application/json</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">x-distributor-id</span>
                                            <span className="text-slate-300">{user?.id || '<SEU_DISTRIBUTOR_ID>'}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        * O ID do distribuidor também pode ser enviado no corpo do JSON como campo "distributor_id".
                                    </p>
                                </div>

                                <Separator className="bg-slate-800" />

                                <div className="space-y-2">
                                    <Label className="text-slate-400">Exemplo cURL</Label>
                                    <div className="relative bg-slate-950 p-4 rounded-md border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                                        <pre>{curlCommand}</pre>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-800" 
                                            onClick={() => handleCopy(curlCommand)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800 text-white">
                            <CardHeader>
                                <CardTitle>Estrutura do JSON</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                        <div>
                                            <span className="font-bold text-white">nome</span> <span className="text-slate-500">(obrigatório)</span>
                                            <p className="text-slate-400">Nome do lead ou cliente.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                        <div>
                                            <span className="font-bold text-white">telefone</span> <span className="text-slate-500">(obrigatório)</span>
                                            <p className="text-slate-400">Número com DDD (ex: 5511999999999).</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                                        <div>
                                            <span className="font-bold text-white">mensagem</span> <span className="text-slate-500">(opcional)</span>
                                            <p className="text-slate-400">Última mensagem recebida.</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Test Column */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800 text-white border-l-4 border-l-indigo-500">
                            <CardHeader>
                                <CardTitle>Testar Envio Agora</CardTitle>
                                <CardDescription>Simule um envio do ConexZap para sua conta.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Payload (JSON)</Label>
                                    <Textarea 
                                        value={payload} 
                                        onChange={(e) => setPayload(e.target.value)}
                                        className="font-mono bg-slate-950 border-slate-700 min-h-[200px]"
                                    />
                                </div>
                                <Button 
                                    onClick={handleTestSend} 
                                    disabled={testLoading || !user}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {testLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar Teste
                                </Button>

                                {testResponse && (
                                    <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500">RESPOSTA DO SERVIDOR</span>
                                            <Badge variant={testResponse.status === 200 ? 'default' : 'destructive'}>
                                                Status: {testResponse.status}
                                            </Badge>
                                        </div>
                                        <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                                            {JSON.stringify(testResponse.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Logs Section inside Test Page */}
                        <div className="pt-4">
                            <h3 className="text-xl font-bold text-white mb-4">Seus Logs Recentes</h3>
                            <WebhookLogsTab />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookTestPage;