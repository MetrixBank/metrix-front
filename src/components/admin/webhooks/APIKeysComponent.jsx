import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, Copy, Eye, EyeOff, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateAPIKey, hashAPIKey } from '@/lib/webhookUtils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const APIKeysComponent = () => {
    const { user } = useAuth();
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newKeyData, setNewKeyData] = useState({ name: '', permissions: ['read'] });
    const [generatedKey, setGeneratedKey] = useState(null);
    const { toast } = useToast();

    const fetchKeys = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('distributor_api_keys')
                .select('*')
                .eq('distributor_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setKeys(data || []);
        } catch (error) {
            console.error("Error fetching keys", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, [user]);

    const handleCreateKey = async () => {
        if (!newKeyData.name) return;
        
        const rawKey = generateAPIKey();
        const hashedKey = await hashAPIKey(rawKey); // Mock hashing for demo

        try {
            const { error } = await supabase
                .from('distributor_api_keys')
                .insert({
                    distributor_id: user.id,
                    key_name: newKeyData.name,
                    key_hash: hashedKey, // In real app, store hash only
                    permissions: newKeyData.permissions,
                    is_active: true
                });

            if (error) throw error;

            setGeneratedKey(rawKey); // Show raw key only once
            fetchKeys();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao criar chave", description: error.message });
        }
    };

    const handleRevoke = async (id) => {
        try {
            const { error } = await supabase
                .from('distributor_api_keys')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            fetchKeys();
            toast({ title: "Chave revogada com sucesso" });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao revogar", description: error.message });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!" });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">Chaves de API</h3>
                    <p className="text-sm text-muted-foreground">Gerencie chaves de acesso para integrações externas.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Nova Chave
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Gerar Nova Chave de API</DialogTitle>
                            <DialogDescription>
                                Configure as permissões para esta chave.
                            </DialogDescription>
                        </DialogHeader>

                        {!generatedKey ? (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome da Chave</Label>
                                    <Input 
                                        placeholder="ex: Integração CRM Externo" 
                                        value={newKeyData.name}
                                        onChange={(e) => setNewKeyData({...newKeyData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Permissões</Label>
                                    <div className="flex flex-col gap-2">
                                        {['read', 'write', 'delete', 'webhooks'].map(perm => (
                                            <div key={perm} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={perm} 
                                                    checked={newKeyData.permissions.includes(perm)}
                                                    onCheckedChange={(checked) => {
                                                        const perms = checked 
                                                            ? [...newKeyData.permissions, perm]
                                                            : newKeyData.permissions.filter(p => p !== perm);
                                                        setNewKeyData({...newKeyData, permissions: perms});
                                                    }}
                                                />
                                                <Label htmlFor={perm} className="capitalize">{perm}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateKey}>Gerar Chave</Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md">
                                    <div className="flex items-center gap-2 text-yellow-500 font-bold mb-2">
                                        <AlertTriangle className="w-4 h-4" /> Atenção
                                    </div>
                                    <p className="text-sm text-yellow-200/80">
                                        Copie sua chave agora. Você não poderá vê-la novamente.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input value={generatedKey} readOnly className="font-mono" />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedKey)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => { setIsCreateOpen(false); setGeneratedKey(null); }}>Concluído</Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Permissões</TableHead>
                            <TableHead>Criada em</TableHead>
                            <TableHead>Último uso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma chave de API ativa.
                                </TableCell>
                            </TableRow>
                        ) : (
                            keys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Key className="w-4 h-4 text-muted-foreground" />
                                        {key.key_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {key.permissions?.map(p => (
                                                <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(key.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Nunca'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRevoke(key.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default APIKeysComponent;