import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const leadSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  interests: z.string().optional(),
});

const AddLeadModal = ({ isOpen, onClose, onLeadAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(leadSchema)
  });

  const onSubmit = async (data) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('leads').insert([{
        ...data,
        user_id: user.id,
        distributor_id: user.id,
        status: 'new',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Lead adicionado com sucesso.",
      });

      reset();
      onClose();
      if (onLeadAdded) onLeadAdded();

    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o lead."
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} placeholder="Ex: Maria Silva" />
            {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input id="phone" {...register('phone')} placeholder="Ex: (11) 99999-9999" />
            {errors.phone && <span className="text-sm text-red-500">{errors.phone.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register('email')} placeholder="Ex: maria@email.com" />
            {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interesses</Label>
            <Textarea id="interests" {...register('interests')} placeholder="O que o cliente busca?" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;