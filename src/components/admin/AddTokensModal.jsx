import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { toast } from '@/components/ui/use-toast';
    import { Coins, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

    const AddTokensModal = ({ isOpen, onClose, distributor, adminUserId, onSuccess }) => {
      const [amount, setAmount] = useState('');
      const [reason, setReason] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [adjustmentType, setAdjustmentType] = useState('add');

      useEffect(() => {
        if (isOpen) {
          setAmount('');
          setReason('');
          setIsLoading(false);
          setAdjustmentType('add');
        }
      }, [isOpen]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!distributor || !adminUserId) {
          toast({ title: "Erro", description: "Distribuidor ou admin não identificado.", variant: "destructive" });
          return;
        }
        
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ title: "Valor Inválido", description: "A quantidade de tokens deve ser um número positivo.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        
        const tokensToAdjust = adjustmentType === 'add' ? parsedAmount : -parsedAmount;
        const actionText = adjustmentType === 'add' ? 'adicionados' : 'removidos';

        try {
          const { error } = await supabase.rpc('admin_adjust_token_balance', {
            p_admin_id: adminUserId,
            p_distributor_id: distributor.id,
            p_reason: reason,
            p_token_change: tokensToAdjust,
          });

          if (error) throw error;

          toast({ title: "Sucesso!", description: `${parsedAmount} tokens ${actionText} para ${distributor.name}.` });
          if(onSuccess) onSuccess();
          onClose();
        } catch (error) {
          console.error("Error adjusting tokens:", error);
          toast({
            title: `Erro ao ${adjustmentType === 'add' ? 'Adicionar' : 'Remover'} Tokens`,
            description: error.message || "Não foi possível completar a operação.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      if (!isOpen) return null;

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-sm border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Coins className="w-5 h-5 mr-2 text-primary" />
                Ajustar Tokens de {distributor?.name}
              </DialogTitle>
              <DialogDescription>
                Adicione ou remova tokens manualmente para este distribuidor.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={adjustmentType} onValueChange={setAdjustmentType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add"><PlusCircle className="w-4 h-4 mr-2"/>Adicionar</TabsTrigger>
                <TabsTrigger value="remove"><MinusCircle className="w-4 h-4 mr-2"/>Remover</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Quantidade de Tokens
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Ex: 100"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Motivo (Obrigatório)
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ex: Bonificação especial por desempenho"
                      className="min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading || !reason.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Confirmar ${adjustmentType === 'add' ? 'Adição' : 'Remoção'}`}
                  </Button>
                </DialogFooter>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    };

    export default AddTokensModal;