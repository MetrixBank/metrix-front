import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const ProposalDetailsModal = ({ proposal, isOpen, onClose, onUpdate, adminUser }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // We use a local state for fields that can be edited
    const [formData, setFormData] = useState({
        status: '',
        admin_notes: '',
        total_value: 0,
        installments: 1,
        upfront_payment: 0,
        interest_rate: 0
    });

    useEffect(() => {
        if (proposal) {
            setFormData({
                status: proposal.status,
                admin_notes: proposal.admin_notes || '',
                total_value: Number(proposal.total_value),
                installments: Number(proposal.installments),
                upfront_payment: Number(proposal.upfront_payment),
                interest_rate: Number(proposal.interest_rate) || 0
            });
        }
    }, [proposal]);

    const handleStatusChange = (value) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Generic Save Function - used by buttons
    const executeUpdate = async (overrideStatus = null) => {
        setLoading(true);
        try {
            const statusToSave = overrideStatus || formData.status;
            
            const { data, error } = await supabase
                .from('fnx_proposals')
                .update({
                    status: statusToSave,
                    admin_notes: formData.admin_notes,
                    total_value: formData.total_value,
                    installments: formData.installments,
                    upfront_payment: formData.upfront_payment,
                    interest_rate: formData.interest_rate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', proposal.id)
                .select()
                .single();

            if (error) throw error;

            // Update receivables if status changed to approved (simplified logic: normally we'd generate receivables properly)
            // For now we just save the proposal state.

            toast({ title: "Proposta atualizada com sucesso!" });
            onUpdate(data);
            onClose();
        } catch (error) {
            console.error("Error updating proposal:", error);
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (!proposal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-card/50 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Detalhes da Proposta #{proposal.id.slice(0, 8)}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                Distribuidor: <span className="font-medium text-primary">{proposal.distributor?.name || 'N/A'}</span>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant={proposal.status === 'approved' ? 'success' : 'outline'} className="capitalize text-sm px-3 py-1">
                                {proposal.status.replace('_', ' ')}
                             </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 bg-background/50">
                    <div className="space-y-8">
                        
                        {/* 1. Quick Actions Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <Button 
                                variant="success" 
                                className="w-full h-12 text-lg shadow-lg hover:scale-105 transition-transform bg-green-600 hover:bg-green-700"
                                onClick={() => executeUpdate('approved')}
                                disabled={loading}
                             >
                                <CheckCircle className="mr-2 h-5 w-5" /> Aprovar Proposta
                             </Button>
                             
                             <Button 
                                variant="destructive" 
                                className="w-full h-12 text-lg shadow-lg hover:scale-105 transition-transform"
                                onClick={() => executeUpdate('rejected')}
                                disabled={loading}
                             >
                                <XCircle className="mr-2 h-5 w-5" /> Rejeitar
                             </Button>
                             
                             <Button 
                                variant="outline" 
                                className="w-full h-12 text-lg shadow-sm hover:bg-yellow-500/10 border-yellow-500 text-yellow-500 hover:text-yellow-600"
                                onClick={() => executeUpdate('awaiting_adjustment')}
                                disabled={loading}
                             >
                                <RotateCcw className="mr-2 h-5 w-5" /> Solicitar Ajuste
                             </Button>
                        </div>

                        <Separator />

                        {/* 2. Admin Controls */}
                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-primary">
                                <AlertTriangle className="w-5 h-5" />
                                Controle Manual
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="mb-2 block">Status Atual</Label>
                                    <Select 
                                        value={formData.status} 
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Rascunho (Pending)</SelectItem>
                                            <SelectItem value="awaiting_analysis">Aguardando Análise</SelectItem>
                                            <SelectItem value="approved">Aprovada</SelectItem>
                                            <SelectItem value="rejected">Rejeitada</SelectItem>
                                            <SelectItem value="awaiting_adjustment">Aguardando Ajuste</SelectItem>
                                            <SelectItem value="completed">Concluída</SelectItem>
                                            <SelectItem value="awaiting_signature">Aguardando Assinatura</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="mb-2 block">Notas do Administrador</Label>
                                    <Input 
                                        value={formData.admin_notes}
                                        onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                                        placeholder="Ex: Documentação pendente..."
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Financial Data */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Dados Financeiros (Editável)</h3>
                                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => setEditMode(!editMode)}>
                                    {editMode ? 'Modo Edição Ativo' : 'Clique para Editar'}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label>Valor Total (R$)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.total_value}
                                        onChange={(e) => handleInputChange('total_value', parseFloat(e.target.value))}
                                        disabled={!editMode}
                                        className={editMode ? "border-primary" : ""}
                                    />
                                </div>
                                <div>
                                    <Label>Entrada (R$)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.upfront_payment}
                                        onChange={(e) => handleInputChange('upfront_payment', parseFloat(e.target.value))}
                                        disabled={!editMode}
                                        className={editMode ? "border-primary" : ""}
                                    />
                                </div>
                                <div>
                                    <Label>Parcelas</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.installments}
                                        onChange={(e) => handleInputChange('installments', parseInt(e.target.value))}
                                        disabled={!editMode}
                                        className={editMode ? "border-primary" : ""}
                                    />
                                </div>
                                <div>
                                    <Label>Juros Mensal (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.interest_rate}
                                        onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value))}
                                        disabled={!editMode}
                                        className={editMode ? "border-primary" : ""}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 4. Products Table */}
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Produtos / Serviços</h3>
                            <div className="border rounded-lg overflow-hidden bg-card">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="p-3 font-medium">Item</th>
                                            <th className="p-3 font-medium text-right">Qtd</th>
                                            <th className="p-3 font-medium text-right">Preço Unit.</th>
                                            <th className="p-3 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proposal.products_data && proposal.products_data.map((item, index) => (
                                            <tr key={index} className="border-t border-border/50 hover:bg-muted/30">
                                                <td className="p-3">{item.name}</td>
                                                <td className="p-3 text-right">{item.quantity}</td>
                                                <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                                                <td className="p-3 text-right font-medium">{formatCurrency(item.quantity * item.price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/50 font-semibold">
                                        <tr>
                                            <td colSpan={3} className="p-3 text-right">Total Produtos</td>
                                            <td className="p-3 text-right">{formatCurrency(proposal.products_data?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                         {/* 5. Customer Info */}
                         <div className="bg-muted/20 rounded-lg p-6 border border-border/30">
                            <h3 className="font-semibold text-lg mb-4">Dados do Cliente</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Nome</span>
                                    <span className="font-medium text-base">{proposal.customer_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">CPF/CNPJ</span>
                                    <span className="font-medium text-base">{proposal.customer_cpf_cnpj || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Telefone</span>
                                    <span className="font-medium text-base">{proposal.customer_phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Email</span>
                                    <span className="font-medium text-base">{proposal.customer_email || '-'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Endereço</span>
                                    <span className="font-medium text-base">
                                        {proposal.customer_address}, {proposal.customer_address_number} {proposal.customer_address_complement}
                                        {proposal.customer_cep ? ` - CEP: ${proposal.customer_cep}` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t bg-card/50 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-between items-center">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button onClick={() => executeUpdate()} disabled={loading} className="min-w-[150px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Manualmente
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};