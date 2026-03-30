import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Settings, Globe, Key, Activity, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import WebhookFieldMappingComponent from './WebhookFieldMappingComponent';
import WebhookExecutionLogsComponent from './WebhookExecutionLogsComponent';
import APIKeysComponent from './APIKeysComponent';
import WebhookTestComponent from './WebhookTestComponent';
import { validateWebhookURL } from '@/lib/webhookUtils';

// Removed DashboardHeader import as requested

const DistributorSettingsPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [webhooks, setWebhooks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isWebhookModalOpen, setIsWebhookModalOpen] = React.useState(false);
    
    // New Webhook State
    const [currentWebhook, setCurrentWebhook] = React.useState({
        name: '',
        url: '',
        method: 'POST',
        event_types: [],
        mappings: [],
        is_active: true
    });

    const EVENT_TYPES = [
        'opportunity_created', 'opportunity_updated', 'sale_made', 
        'contact_created', 'status_changed'
    ];

    const fetchWebhooks = React.useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('distributor_webhooks')
                .select('*')
                .eq('distributor_id', user.id);
            
            if (error) throw error;
            
            // For each webhook, fetch mappings (simplified N+1 for demo, use join in real app)
            const enrichedWebhooks = await Promise.all((data || []).map(async (hook) => {
                const { data: maps } = await supabase.from('webhook_field_mappings').select('*').eq('webhook_id', hook.id);
                return { ...hook, mappings: maps || [] };
            }));

            setWebhooks(enrichedWebhooks);
        } catch (error) {
            console.error("Error fetching webhooks", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        fetchWebhooks();
    }, [fetchWebhooks]);

    const handleSaveWebhook = async () => {
        const urlValidation = validateWebhookURL(currentWebhook.url);
        if (!urlValidation.isValid) {
            toast({ variant: "destructive", title: "URL Inválida", description: urlValidation.error });
            return;
        }

        try {
            // 1. Upsert Webhook
            const webhookData = {
                distributor_id: user.id,
                name: currentWebhook.name,
                url: currentWebhook.url,
                method: currentWebhook.method,
                event_types: currentWebhook.event_types,
                is_active: currentWebhook.is_active
            };
            
            let hookId = currentWebhook.id;

            if (currentWebhook.id) {
                const { error } = await supabase.from('distributor_webhooks').update(webhookData).eq('id', currentWebhook.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('distributor_webhooks').insert(webhookData).select();
                if (error) throw error;
                hookId = data[0].id;
            }

            // 2. Handle Mappings (Delete all and re-insert for simplicity in this demo)
            if (hookId) {
                await supabase.from('webhook_field_mappings').delete().eq('webhook_id', hookId);
                
                if (currentWebhook.mappings.length > 0) {
                    const mappingsToInsert = currentWebhook.mappings.map(m => ({
                        webhook_id: hookId,
                        external_field_name: m.external_field_name,
                        internal_field_name: m.internal_field_name,
                        data_type: m.data_type,
                        is_required: m.is_required
                    }));
                    const { error: mapError } = await supabase.from('webhook_field_mappings').insert(mappingsToInsert);
                    if (mapError) throw mapError;
                }
            }

            toast({ title: "Webhook salvo com sucesso!" });
            setIsWebhookModalOpen(false);
            fetchWebhooks();
            setCurrentWebhook({ name: '', url: '', method: 'POST', event_types: [], mappings: [], is_active: true });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        }
    };

    const handleDeleteWebhook = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este webhook?")) return;
        try {
            await supabase.from('distributor_webhooks').delete().eq('id', id);
            fetchWebhooks();
            toast({ title: "Webhook excluído" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
        }
    };

    const openEditModal = (hook) => {
        setCurrentWebhook(hook);
        setIsWebhookModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações de Integração</h1>
                    <p className="text-muted-foreground mt-1">Gerencie webhooks, chaves de API e logs de eventos.</p>
                </div>
            </div>

            <Tabs defaultValue="webhooks" className="w-full">
                <TabsList className="bg-muted border border-border">
                    <TabsTrigger value="webhooks" className="gap-2"><Globe className="w-4 h-4"/> Webhooks</TabsTrigger>
                    <TabsTrigger value="apikeys" className="gap-2"><Key className="w-4 h-4"/> Chaves de API</TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2"><Activity className="w-4 h-4"/> Logs de Execução</TabsTrigger>
                </TabsList>

                {/* WEBHOOKS TAB */}
                <TabsContent value="webhooks" className="mt-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Seus Webhooks</h2>
                        <Button onClick={() => {
                            setCurrentWebhook({ name: '', url: '', method: 'POST', event_types: [], mappings: [], is_active: true });
                            setIsWebhookModalOpen(true);
                        }} className="gap-2">
                            <Plus className="w-4 h-4" /> Novo Webhook
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {webhooks.length === 0 ? (
                            <Card className="bg-card border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Globe className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Nenhum webhook configurado.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            webhooks.map(hook => (
                                <Card key={hook.id} className="bg-card border-border">
                                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg">{hook.name}</h3>
                                                {hook.is_active ? 
                                                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Ativo</Badge> : 
                                                    <Badge variant="secondary">Inativo</Badge>
                                                }
                                                <Badge variant="outline">{hook.method}</Badge>
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded inline-block">
                                                {hook.url}
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {hook.event_types?.map(et => (
                                                    <Badge key={et} variant="secondary" className="text-xs">{et}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <WebhookTestComponent 
                                                webhookUrl={hook.url} 
                                                method={hook.method} 
                                                mappings={hook.mappings} 
                                            />
                                            <Button variant="outline" size="icon" onClick={() => openEditModal(hook)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteWebhook(hook.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* API KEYS TAB */}
                <TabsContent value="apikeys" className="mt-6">
                    <APIKeysComponent />
                </TabsContent>

                {/* LOGS TAB */}
                <TabsContent value="logs" className="mt-6">
                    <WebhookExecutionLogsComponent />
                </TabsContent>
            </Tabs>

            {/* WEBHOOK MODAL */}
            <Dialog open={isWebhookModalOpen} onOpenChange={setIsWebhookModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentWebhook.id ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
                        <DialogDescription>
                            Configure os detalhes de envio e mapeamento de dados.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome do Webhook</Label>
                                <Input 
                                    value={currentWebhook.name} 
                                    onChange={(e) => setCurrentWebhook({...currentWebhook, name: e.target.value})} 
                                    placeholder="ex: Integração CRM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Método HTTP</Label>
                                <Select 
                                    value={currentWebhook.method} 
                                    onValueChange={(val) => setCurrentWebhook({...currentWebhook, method: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>URL de Destino</Label>
                            <Input 
                                value={currentWebhook.url} 
                                onChange={(e) => setCurrentWebhook({...currentWebhook, url: e.target.value})} 
                                placeholder="https://api.exemplo.com/webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Eventos Gatilho</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-3 rounded-md">
                                {EVENT_TYPES.map(type => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Switch 
                                            id={type}
                                            checked={currentWebhook.event_types?.includes(type)}
                                            onCheckedChange={(checked) => {
                                                const types = checked 
                                                    ? [...(currentWebhook.event_types || []), type]
                                                    : (currentWebhook.event_types || []).filter(t => t !== type);
                                                setCurrentWebhook({...currentWebhook, event_types: types});
                                            }}
                                        />
                                        <Label htmlFor={type} className="cursor-pointer text-sm font-normal">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="active-mode" 
                                    checked={currentWebhook.is_active}
                                    onCheckedChange={(checked) => setCurrentWebhook({...currentWebhook, is_active: checked})}
                                />
                                <Label htmlFor="active-mode">Webhook Ativo</Label>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <WebhookFieldMappingComponent 
                                mappings={currentWebhook.mappings || []}
                                onChange={(newMappings) => setCurrentWebhook({...currentWebhook, mappings: newMappings})}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWebhookModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveWebhook}>Salvar Webhook</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DistributorSettingsPage;