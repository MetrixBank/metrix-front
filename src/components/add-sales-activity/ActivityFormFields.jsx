import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  ListChecks, 
  Lightbulb,
  FileText,
  DollarSign
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/contexts/LocalizationContext';

export const ActivityFormFields = () => {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const { t } = useLocalization();

  const activityType = watch('activity_type');
  const status = watch('status');

  const activityTypes = [
    { value: 'negocio', label: 'Negócio' },
    { value: 'visit_made', label: 'Visita' }, // Mapped to internal type if needed, or keeping standard strings
    { value: 'proposta', label: 'Proposta' },
    { value: 'pos_venda', label: 'Pós-venda' },
    { value: 'limpeza_indicacao', label: 'Limpeza/Indicação' },
    { value: 'troca_refil', label: 'Troca de Refil' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'prospeccao', label: 'Prospecção' }, // Keeping system types
    { value: 'apresentacao', label: 'Apresentação' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'fechamento', label: 'Fechamento' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Agendada' },
    { value: 'visit_made', label: 'Concluída' },
    { value: 'in_progress', label: 'Em Progresso' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'sale_made', label: 'Venda Realizada' } // Crucial for system logic
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-2">
      
      {/* --- Detalhes da Visita --- */}
      <div className="space-y-4">
        <h3 className="flex items-center text-sm font-semibold text-primary border-b pb-2 mb-3">
          <ListChecks className="w-4 h-4 mr-2" />
          Detalhes da Visita
        </h3>
        
        {/* Row 1: Data & Horário */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="visit_date" className="flex items-center text-xs font-medium text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 mr-1.5"/>
              DATA <span className="text-destructive ml-1">*</span>
            </Label>
            <Input 
              id="visit_date" 
              type="date" 
              {...register('visit_date')}
              className={`h-9 ${errors.visit_date ? "border-destructive" : "bg-background"}`}
            />
            {errors.visit_date && <span className="text-[10px] text-destructive">{errors.visit_date.message}</span>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visit_time" className="flex items-center text-xs font-medium text-muted-foreground">
              <Clock className="w-3.5 h-3.5 mr-1.5"/>
              HORÁRIO <span className="text-destructive ml-1">*</span>
            </Label>
            <Input 
              id="visit_time" 
              type="time" 
              {...register('visit_time')}
              className={`h-9 ${errors.visit_time ? "border-destructive" : "bg-background"}`}
            />
            {errors.visit_time && <span className="text-[10px] text-destructive">{errors.visit_time.message}</span>}
          </div>
        </div>

        {/* Row 2: Status & Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center text-xs font-medium text-muted-foreground">
              <Activity className="w-3.5 h-3.5 mr-1.5"/>
              STATUS <span className="text-destructive ml-1">*</span>
            </Label>
            <Select 
              value={status} 
              onValueChange={(val) => setValue('status', val, { shouldValidate: true })}
            >
              <SelectTrigger className={`h-9 ${errors.status ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center text-xs font-medium text-muted-foreground">
              <ListChecks className="w-3.5 h-3.5 mr-1.5"/>
              TIPO DE ATIVIDADE <span className="text-destructive ml-1">*</span>
            </Label>
            <Select 
              value={activityType} 
              onValueChange={(val) => setValue('activity_type', val, { shouldValidate: true })}
            >
              <SelectTrigger className={`h-9 ${errors.activity_type ? "border-destructive" : ""}`}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Consultor */}
        <div className="space-y-1.5">
          <Label htmlFor="consultant_name" className="flex items-center text-xs font-medium text-muted-foreground">
            <User className="w-3.5 h-3.5 mr-1.5"/>
            CONSULTOR RESPONSÁVEL
          </Label>
          <Input 
            id="consultant_name" 
            {...register('consultant_name')}
            placeholder="Nome do consultor"
            className="h-9 bg-background"
          />
        </div>
      </div>

      {/* --- Inteligência & Potencial --- */}
      <div className="space-y-4 pt-2">
        <h3 className="flex items-center text-sm font-semibold text-amber-600 dark:text-amber-500 border-b pb-2 mb-3">
          <Lightbulb className="w-4 h-4 mr-2" />
          Inteligência & Potencial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pathology" className="text-xs font-medium text-muted-foreground">
              PATOLOGIAS / INTERESSES
            </Label>
            <Input 
              id="pathology"
              {...register('pathology')}
              placeholder="Ex: Diabetes, Dor nas costas..."
              className="h-9 bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="potential_products" className="text-xs font-medium text-muted-foreground">
              PRODUTOS POTENCIAIS
            </Label>
            <Input 
              id="potential_products"
              {...register('potential_products')}
              placeholder="Ex: Colchão, Pulseira..."
              className="h-9 bg-background"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="objections" className="text-xs font-medium text-muted-foreground">
              OBJEÇÕES IDENTIFICADAS
            </Label>
            <Input 
              id="objections"
              {...register('objections')}
              placeholder="Ex: Preço alto..."
              className="h-9 bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimated_value" className="text-xs font-medium text-muted-foreground flex items-center">
              VALOR FINANCEIRO POTENCIAL
              <span className="text-[10px] text-muted-foreground font-normal ml-1">(Opcional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input 
                id="estimated_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('estimated_value')}
                className={`h-9 pl-9 bg-background ${errors.estimated_value ? "border-destructive" : "border-emerald-100 focus-visible:ring-emerald-500/20"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Observações --- */}
      <div className="space-y-4 pt-2">
        <h3 className="flex items-center text-sm font-semibold text-primary border-b pb-2 mb-3">
          <FileText className="w-4 h-4 mr-2" />
          Observações
        </h3>
        <Textarea 
          id="notes" 
          {...register('notes')} 
          placeholder="Observações adicionais sobre a atividade..."
          className="min-h-[100px] bg-background resize-none"
        />
      </div>

    </div>
  );
};