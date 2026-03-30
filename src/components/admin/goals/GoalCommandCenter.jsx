import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, X, EyeOff } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(5, 'O nome da meta deve ter pelo menos 5 caracteres.'),
  description: z.string().optional(),
  type: z.string().nonempty('O tipo da meta é obrigatório.'),
  ranking_type: z.enum(['points', 'revenue', 'tokens'], { required_error: "O tipo de ranking é obrigatório." }),
  target_value_primary: z.number({ required_error: "O valor alvo é obrigatório." }).min(0, 'O valor alvo deve ser positivo.'),
  target_value_secondary: z.number().optional(),
  dateRange: z.object({
    from: z.date({ required_error: "A data de início é obrigatória." }),
    to: z.date({ required_error: "A data de término é obrigatória." }),
  }),
  subtitle: z.string().optional(),
  distributor_type: z.string().optional(),
  ranking_limit: z.coerce.number().optional(),
  hide_ranking: z.boolean().optional(),
  initial_revenue_value: z.coerce.number().optional(),
  display_order: z.coerce.number().optional(),
});

const GoalCommandCenter = ({ goalToEdit, onGoalUpserted, distributorTypeForNewGoal, goalsCount = 0 }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { register, handleSubmit, control, reset, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      hide_ranking: false,
      initial_revenue_value: 0,
      ranking_type: 'points',
      type: 'points_accumulated'
    }
  });

  const selectedType = watch('type');
  const selectedRankingType = watch('ranking_type');

  // Auto-set ranking type based on goal type for convenience, but allow override
  useEffect(() => {
    if (!goalToEdit) {
      if (selectedType === 'token_ranking') setValue('ranking_type', 'tokens');
      else if (selectedType === 'team_revenue') setValue('ranking_type', 'revenue');
      else if (selectedType === 'points_accumulated') setValue('ranking_type', 'points');
    }
  }, [selectedType, setValue, goalToEdit]);

  useEffect(() => {
    if (goalToEdit) {
      reset({
        name: goalToEdit.name || '',
        description: goalToEdit.description || '',
        type: goalToEdit.type || 'points_accumulated',
        ranking_type: goalToEdit.ranking_type || 'points',
        target_value_primary: goalToEdit.target_value_primary || 0,
        target_value_secondary: goalToEdit.target_value_secondary || 0,
        dateRange: {
          from: goalToEdit.start_date ? new Date(goalToEdit.start_date) : new Date(),
          to: goalToEdit.end_date ? new Date(goalToEdit.end_date) : addDays(new Date(), 30),
        },
        subtitle: goalToEdit.config?.subtitle || '',
        distributor_type: goalToEdit.distributor_type || 'all',
        ranking_limit: goalToEdit.config?.ranking_limit || 10,
        hide_ranking: goalToEdit.config?.hide_ranking || false,
        initial_revenue_value: goalToEdit.config?.initial_revenue_value || 0,
        display_order: goalToEdit.display_order || 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        type: 'points_accumulated',
        ranking_type: 'points',
        target_value_primary: 0,
        target_value_secondary: 0,
        dateRange: {
          from: new Date(),
          to: addDays(new Date(), 30),
        },
        subtitle: '',
        distributor_type: distributorTypeForNewGoal || 'all',
        ranking_limit: 10,
        hide_ranking: false,
        initial_revenue_value: 0,
        display_order: goalsCount + 1,
      });
    }
  }, [goalToEdit, reset, distributorTypeForNewGoal, goalsCount]);

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const goalData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        ranking_type: formData.ranking_type,
        target_value_primary: formData.target_value_primary,
        target_value_secondary: formData.target_value_secondary,
        start_date: formData.dateRange.from.toISOString(),
        end_date: formData.dateRange.to.toISOString(),
        is_active: true,
        config: {
          subtitle: formData.subtitle,
          ranking_limit: formData.ranking_limit,
          hide_ranking: formData.type === 'team_revenue' ? formData.hide_ranking : undefined,
          initial_revenue_value: formData.type === 'team_revenue' ? formData.initial_revenue_value : undefined,
        },
        created_by: user?.id,
        distributor_type: formData.distributor_type,
        display_order: formData.display_order,
      };

      let result;
      if (goalToEdit) {
        // Prevent changing ranking type if it already has progress (simplified check logic for UI)
        if (goalToEdit.ranking_type && goalToEdit.ranking_type !== formData.ranking_type) {
           // We allow it but maybe warn - actually logic is complex to check progress count here. 
           // For now we allow edit, backend trigger will handle new updates.
        }
        
        result = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goalToEdit.id)
          .select();
      } else {
        result = await supabase
          .from('goals')
          .insert([goalData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: `Meta ${goalToEdit ? 'atualizada' : 'criada'} com sucesso!`,
        description: `A meta "${formData.name}" foi salva.`,
        variant: 'success',
      });
      
      if(onGoalUpserted) onGoalUpserted();
      reset();

    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: 'Erro ao salvar meta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onGoalUpserted) onGoalUpserted();
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
       {goalToEdit && (
         <Alert variant="default" className="bg-blue-50 border-blue-200">
           <AlertCircle className="h-4 w-4 text-blue-600" />
           <AlertTitle className="text-blue-800">Editando Meta</AlertTitle>
           <AlertDescription className="text-blue-700">
             Cuidado ao alterar o tipo de ranking de uma meta em andamento, pois pode afetar o cálculo de progresso existente.
           </AlertDescription>
         </Alert>
       )}
       
       <div>
        <Label htmlFor="name">Nome da Meta</Label>
        <Input id="name" {...register('name')} placeholder="Ex: Campeão do Mês" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="subtitle">Subtítulo (Prêmio)</Label>
        <Input id="subtitle" {...register('subtitle')} placeholder="Ex: Jantar com os Líderes" />
        {errors.subtitle && <p className="text-red-500 text-xs mt-1">{errors.subtitle.message}</p>}
      </div>
       <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register('description')} placeholder="Descreva os detalhes e regras da meta." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Categoria da Meta</Label>
           <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points_accumulated">Campanha de Pontos</SelectItem>
                  <SelectItem value="token_ranking">Campanha de Tokens</SelectItem>
                  <SelectItem value="team_revenue">Campanha de Faturamento</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <Label>Métrica de Ranking (Obrigatório)</Label>
           <Controller
            name="ranking_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Pontos (pts)</SelectItem>
                  <SelectItem value="revenue">Faturamento (R$)</SelectItem>
                  <SelectItem value="tokens">Tokens</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.ranking_type && <p className="text-red-500 text-xs mt-1">{errors.ranking_type.message}</p>}
        </div>
      </div>
      
      {/* Distributor Type Logic */}
       {!distributorTypeForNewGoal && (
         <div>
          <Label>Aplicável Para</Label>
            <Controller
              name="distributor_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="external">Externos</SelectItem>
                    <SelectItem value="team">Equipe Interna</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
         </div>
       )}
       {distributorTypeForNewGoal === "team" && (
          <input type="hidden" {...register('distributor_type')} value="team" />
       )}

      {selectedType === 'team_revenue' && (
        <div className="p-4 border rounded-md bg-muted/50 space-y-4">
            <div>
              <Label htmlFor="initial_revenue_value">Valor Inicial (Faturamento Anterior)</Label>
              <Input id="initial_revenue_value" type="number" {...register('initial_revenue_value')} placeholder="Ex: 50000" />
              <p className="text-xs text-muted-foreground mt-1">Adicione um valor base para metas anuais.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="hide_ranking"
                control={control}
                render={({ field }) => <Switch id="hide_ranking" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="hide_ranking" className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Ocultar ranking individual e mostrar apenas o total
              </Label>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="target_value_primary">Alvo Principal</Label>
          <div className="relative">
            <Input 
                id="target_value_primary" 
                type="number" 
                {...register('target_value_primary', { valueAsNumber: true })} 
                placeholder="Ex: 5000" 
                className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                {selectedRankingType === 'revenue' ? 'R$' : selectedRankingType === 'tokens' ? 'T' : 'P'}
            </span>
          </div>
          {errors.target_value_primary && <p className="text-red-500 text-xs mt-1">{errors.target_value_primary.message}</p>}
        </div>
        <div>
          <Label htmlFor="target_value_secondary">Alvo Secundário (Opcional)</Label>
           <div className="relative">
            <Input 
                id="target_value_secondary" 
                type="number" 
                {...register('target_value_secondary', { valueAsNumber: true })} 
                placeholder="Ex: 1000" 
                className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                {selectedRankingType === 'revenue' ? 'R$' : selectedRankingType === 'tokens' ? 'T' : 'P'}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Período da Meta</Label>
            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <DatePickerWithRange
                  date={field.value}
                  setDate={(newDate) => {
                    field.onChange(newDate);
                  }}
                />
              )}
            />
            {errors.dateRange?.from && <p className="text-red-500 text-xs mt-1">{errors.dateRange.from.message}</p>}
            {errors.dateRange?.to && <p className="text-red-500 text-xs mt-1">{errors.dateRange.to.message}</p>}
        </div>
        <div>
          <Label>Tamanho do Ranking</Label>
           <Controller
            name="ranking_limit"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Mostrar quantos no pódio?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Top 3</SelectItem>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.ranking_limit && <p className="text-red-500 text-xs mt-1">{errors.ranking_limit.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="display_order">Ordem de Exibição</Label>
        <Input id="display_order" type="number" {...register('display_order')} placeholder="Ex: 1" />
        <p className="text-xs text-muted-foreground mt-1">Metas com menor número aparecem primeiro.</p>
        {errors.display_order && <p className="text-red-500 text-xs mt-1">{errors.display_order.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {goalToEdit ? 'Salvar Alterações' : 'Criar Meta'}
        </Button>
      </div>
    </form>
  );
};

export default GoalCommandCenter;