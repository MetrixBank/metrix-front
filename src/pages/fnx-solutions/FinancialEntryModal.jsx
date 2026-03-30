import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2, CalendarPlus as CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const FinancialEntryModal = ({ isOpen, onClose, onSave, entry, user }) => {
    const { toast } = useToast();
    const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            description: '',
            amount: '',
            type: 'expense',
            category: 'outros',
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0]
        }
    });

    const type = watch('type');

    useEffect(() => {
        if (isOpen) {
            if (entry) {
                setValue('description', entry.description);
                setValue('amount', entry.amount);
                setValue('type', entry.type);
                setValue('status', entry.status);
                setValue('due_date', entry.due_date ? entry.due_date.split('T')[0] : new Date().toISOString().split('T')[0]);
                setValue('category', entry.type === 'income' ? (entry.income_category || 'outros') : (entry.expense_category || 'outros'));
            } else {
                reset({
                    description: '',
                    amount: '',
                    type: 'expense',
                    category: 'outros',
                    status: 'pending',
                    due_date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, entry, setValue, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                user_id: user.id,
                description: data.description,
                amount: parseFloat(data.amount),
                type: data.type,
                status: data.status,
                due_date: data.due_date,
                is_recurring: false,
                [data.type === 'income' ? 'income_category' : 'expense_category']: data.category,
                updated_at: new Date().toISOString()
            };

            let error;
            if (entry) {
                const { error: updateError } = await supabase
                    .from('horizons_financial_entries')
                    .update(payload)
                    .eq('id', entry.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('horizons_financial_entries')
                    .insert([{ ...payload, created_at: new Date().toISOString() }]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: "Sucesso!", description: "Lançamento salvo com sucesso.", variant: "success" });
            onSave();

        } catch (error) {
            console.error('Error saving entry:', error);
            toast({ title: "Erro", description: "Não foi possível salvar o lançamento.", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!entry) return;
        try {
            const { error } = await supabase
                .from('horizons_financial_entries')
                .delete()
                .eq('id', entry.id);
            
            if (error) throw error;
            
            toast({ title: "Excluído", description: "Lançamento removido." });
            onSave();
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{entry ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select 
                                onValueChange={(val) => setValue('type', val)} 
                                defaultValue={watch('type')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="income">Receita (+)</SelectItem>
                                    <SelectItem value="expense">Despesa (-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                                onValueChange={(val) => setValue('status', val)} 
                                defaultValue={watch('status')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">{type === 'income' ? 'Recebido' : 'Pago'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <div className="relative">
                            <Input 
                                id="amount" 
                                type="number" 
                                step="0.01" 
                                className="pl-3 font-semibold"
                                placeholder="0.00" 
                                {...register('amount', { required: true, min: 0.01 })} 
                            />
                        </div>
                        {errors.amount && <span className="text-xs text-destructive">Valor obrigatório</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input 
                            id="description" 
                            placeholder="Ex: Aluguel, Venda do Cliente X..." 
                            {...register('description', { required: true })} 
                        />
                        {errors.description && <span className="text-xs text-destructive">Descrição obrigatória</span>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                         <Select 
                                onValueChange={(val) => setValue('category', val)} 
                                defaultValue={watch('category')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {type === 'income' ? (
                                        <>
                                            <SelectItem value="venda">Venda</SelectItem>
                                            <SelectItem value="servico">Serviço</SelectItem>
                                            <SelectItem value="salario">Salário</SelectItem>
                                            <SelectItem value="boleto">Boleto FnX</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="moradia">Moradia</SelectItem>
                                            <SelectItem value="alimentacao">Alimentação</SelectItem>
                                            <SelectItem value="transporte">Transporte</SelectItem>
                                            <SelectItem value="lazer">Lazer</SelectItem>
                                            <SelectItem value="saude">Saúde</SelectItem>
                                            <SelectItem value="educacao">Educação</SelectItem>
                                            <SelectItem value="impostos">Impostos</SelectItem>
                                            <SelectItem value="fornecedor">Fornecedor</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Data de Vencimento</Label>
                        <Input 
                            id="due_date" 
                            type="date" 
                            {...register('due_date', { required: true })} 
                        />
                    </div>

                    <DialogFooter className="gap-2 mt-4 pt-4 border-t">
                        {entry && (
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon"
                                onClick={handleDelete}
                                className="mr-auto"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FinancialEntryModal;