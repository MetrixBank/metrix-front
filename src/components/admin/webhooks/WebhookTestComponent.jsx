import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const WebhookTestComponent = ({ webhookUrl, method, mappings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [payload, setPayload] = useState('{\n  "event": "test_event",\n  "data": {\n    "message": "Hello World"\n  }\n}');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { toast } = useToast();

    // Pre-fill payload based on mappings if available
    React.useEffect(() => {
        if (mappings && mappings.length > 0) {
            const demoObj = {};
            mappings.forEach(m => {
                demoObj[m.external_field_name] = m.data_type === 'number' ? 123 : m.data_type === 'boolean' ? true : "test_value";
            });
            setPayload(JSON.stringify(demoObj, null, 2));
        }
    }, [mappings, isOpen]);

    const handleTest = async () => {
        if (!webhookUrl) {
            toast({ variant: "destructive", title: "URL ausente", description: "Configure a URL do webhook antes de testar." });
            return;
        }

        setLoading(true);
        setResult(null);

        const startTime = Date.now();

        try {
            // In a real app, this would likely call a backend proxy to avoid CORS if the webhook is external
            // For internal webhooks (Edge Functions), we can call directly or via our own backend.
            // Simulating a call to the edge function
            
            // NOTE: Since we can't easily execute the actual edge function from frontend localhost without auth/cors setup perfectly in this mock,
            // we will simulate the request logic or assume the URL is reachable.
            
            const response = await fetch(webhookUrl, {
                method: method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Metrix-Test': 'true'
                },
                body: payload
            });

            const endTime = Date.now();
            const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));

            setResult({
                status: response.status,
                statusText: response.statusText,
                body: data,
                time: endTime - startTime,
                success: response.ok
            });
            
            if (response.ok) {
                toast({ title: "Teste realizado com sucesso!", className: "bg-green-500/10 text-green-500 border-green-500/20" });
            } else {
                toast({ variant: "destructive", title: "O webhook retornou erro." });
            }

        } catch (error) {
            setResult({
                status: 0,
                statusText: 'Network Error',
                body: { error: error.message },
                time: Date.now() - startTime,
                success: false
            });
            toast({ variant: "destructive", title: "Erro de conexão", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Play className="w-4 h-4" /> Testar Webhook
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Testar Webhook</DialogTitle>
                    <DialogDescription>
                        Envie uma requisição de teste para validar a configuração.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Payload JSON (Corpo da Requisição)</Label>
                        <Textarea 
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            className="font-mono text-xs h-32 resize-none"
                            placeholder="{ ... }"
                        />
                    </div>

                    {result && (
                        <div className={cn("rounded-md p-3 text-sm border", result.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20")}>
                            <div className="flex items-center gap-2 font-bold mb-2">
                                {result.success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                                <span>Status: {result.status} {result.statusText}</span>
                                <span className="ml-auto text-xs opacity-70">{result.time}ms</span>
                            </div>
                            <pre className="text-xs overflow-auto max-h-32 bg-background/50 p-2 rounded">
                                {JSON.stringify(result.body, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Fechar</Button>
                    <Button onClick={handleTest} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? 'Enviando...' : 'Enviar Teste'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WebhookTestComponent;