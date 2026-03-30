import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, DollarSign, AlertCircle, TrendingDown, Wallet, Calendar, Check, ChevronsUpDown, Package } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const SaleDetailsFormFields = ({ availableProducts = [] }) => {
  const { register, control, setValue, getValues, formState: { errors } } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products"
  });

  // Local state for the "Add Product" section
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Watchers for calculations
  const watchedProducts = useWatch({ control, name: "products" });
  const commission = useWatch({ control, name: "commission_value" }) || 0;
  const otherCosts = useWatch({ control, name: "other_costs" }) || 0;
  const taxAmount = useWatch({ control, name: "tax_amount" }) || 0;
  const taxType = useWatch({ control, name: "tax_type" }) || 'fixed';
  
  const currentInstallments = useWatch({ control, name: "installments_count" }) || 1;
  const [isInstallment, setIsInstallment] = useState(currentInstallments > 1);

  // Debug log for product selection
  useEffect(() => {
    if (selectedProductId) {
      const prod = availableProducts.find(p => p.id === selectedProductId);
      if (prod) {
        setUnitPrice(prod.sale_price || 0);
      }
    }
  }, [selectedProductId, availableProducts]);

  // Handle Add Product
  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast({ title: "Erro", description: "Selecione um produto.", variant: "destructive" });
      return;
    }
    
    const product = availableProducts.find(p => p.id === selectedProductId);
    
    // Stock Validation
    if (product && product.quantity_in_stock < Number(quantity)) {
        toast({
            title: "Estoque Insuficiente",
            description: `O produto "${product.name}" tem apenas ${product.quantity_in_stock} unidades disponíveis.`,
            variant: "destructive"
        });
        return;
    }
    
    // Ensure we capture cost price, defaulting to 0 if missing
    const costPrice = product?.cost_price ? Number(product.cost_price) : 0;

    append({
        product_id: selectedProductId,
        quantity_sold: Number(quantity),
        unit_sale_price_at_sale: Number(unitPrice),
        unit_cost_price_at_sale: costPrice
    });

    // Reset fields
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
  };

  // --- CALCULATIONS ---
  
  // 1. Subtotal (Revenue) = Sum(qty * unit_sale_price)
  const subtotal = (watchedProducts || []).reduce((acc, item) => {
    return acc + (Number(item.quantity_sold || 0) * Number(item.unit_sale_price_at_sale || 0));
  }, 0);

  // 2. Total Cost (COGS) = Sum(qty * unit_cost_price)
  const totalCost = (watchedProducts || []).reduce((acc, item) => {
    return acc + (Number(item.quantity_sold || 0) * Number(item.unit_cost_price_at_sale || 0));
  }, 0);

  // 3. Gross Profit = Subtotal - Total Cost
  const grossProfit = subtotal - totalCost;

  // 4. Tax Calculation
  let calculatedTaxValue = 0;
  if (taxType === 'percentage') {
      calculatedTaxValue = subtotal * (Number(taxAmount) / 100);
  } else {
      calculatedTaxValue = Number(taxAmount);
  }

  // 5. Total Deductions = Commission + Discount (Other Costs) + Tax
  const totalDeductions = Number(commission) + Number(otherCosts) + calculatedTaxValue;

  // 6. Net Profit = Gross Profit - Total Deductions
  const netProfit = grossProfit - totalDeductions;

  // 7. Margin = (Net Profit / Subtotal) * 100 (Prevent division by zero)
  const margin = subtotal > 0 ? (netProfit / subtotal) * 100 : 0;

  // Sync total sale value to form state for submission
  useEffect(() => {
      setValue('sale_value', subtotal);
  }, [subtotal, setValue]);

  // Sync isInstallment state on mount if editing
  useEffect(() => {
      if (currentInstallments > 1) {
          setIsInstallment(true);
      }
  }, []);

  const selectedProductLabel = selectedProductId 
    ? availableProducts.find((p) => p.id === selectedProductId)?.name 
    : "Selecione um produto...";

  return (
    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION 1: SELECIONAR PRODUTO */}
      <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border">
          <Label className="text-sm font-semibold text-primary">SELECIONAR PRODUTO</Label>
          <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-grow space-y-1.5 w-full relative">
                  <Label className="text-xs text-muted-foreground">Produto</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-background"
                      >
                        <span className="truncate">{selectedProductLabel}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 z-[200]">
                      <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                              {availableProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name} // Search by name
                                  onSelect={(currentValue) => {
                                    // Because CommandItem value is normalized (lowercase), we use ID for selection logic
                                    setSelectedProductId(product.id);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col w-full">
                                      <div className="flex justify-between items-center">
                                        <span>{product.name}</span>
                                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full", 
                                            product.quantity_in_stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {product.quantity_in_stock} un
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                          {formatCurrency(product.sale_price)}
                                      </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
              
              <div className="w-full md:w-24 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qtd</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-background"
                  />
              </div>

              <div className="w-full md:w-32 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Preço Unit.</Label>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01" 
                    value={unitPrice} 
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="bg-background"
                  />
              </div>

              <Button type="button" onClick={handleAddProduct} disabled={!selectedProductId} className="w-full md:w-auto">
                  <Plus className="w-4 h-4" />
              </Button>
          </div>
      </div>

      {/* SECTION 2: PRODUTOS TABLE */}
      <div className="space-y-2">
         <div className="flex justify-between items-center">
             <Label className="text-sm font-semibold text-primary">PRODUTOS ADICIONADOS</Label>
             <span className="text-xs text-muted-foreground">{fields.length} itens</span>
         </div>
         
         <div className="rounded-md border bg-background overflow-hidden">
             {fields.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                     <Package className="w-8 h-8 text-muted-foreground/50" />
                     <p className="text-sm">Nenhum produto selecionado.</p>
                     <p className="text-xs opacity-70">Adicione produtos acima para continuar.</p>
                 </div>
             ) : (
                 <div className="w-full overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                           <tr>
                               <th className="px-4 py-2 font-medium">Produto</th>
                               <th className="px-4 py-2 font-medium w-20 text-center">Qtd</th>
                               <th className="px-4 py-2 font-medium w-32 text-right">Preço Unit.</th>
                               <th className="px-4 py-2 font-medium w-32 text-right">Subtotal</th>
                               <th className="px-4 py-2 w-10"></th>
                           </tr>
                       </thead>
                       <tbody className="divide-y">
                           {fields.map((field, index) => {
                               const prod = availableProducts.find(p => p.id === field.product_id);
                               return (
                                   <tr key={field.id} className="hover:bg-muted/10 transition-colors">
                                       <td className="px-4 py-2 font-medium">
                                          <div>{prod?.name || 'Produto Removido'}</div>
                                          <div className="text-[10px] text-muted-foreground">Custo: {formatCurrency(field.unit_cost_price_at_sale)}</div>
                                       </td>
                                       <td className="px-4 py-2 text-center">{field.quantity_sold}</td>
                                       <td className="px-4 py-2 text-right">{formatCurrency(field.unit_sale_price_at_sale)}</td>
                                       <td className="px-4 py-2 text-right font-semibold">
                                           {formatCurrency(field.quantity_sold * field.unit_sale_price_at_sale)}
                                       </td>
                                       <td className="px-4 py-2 text-center">
                                           <button 
                                             type="button" 
                                             onClick={() => remove(index)}
                                             className="text-muted-foreground hover:text-destructive transition-colors"
                                           >
                                               <Trash2 className="w-4 h-4" />
                                           </button>
                                       </td>
                                   </tr>
                               );
                           })}
                       </tbody>
                   </table>
                 </div>
             )}
         </div>
         {errors.products && (
             <p className="text-xs text-destructive mt-1 flex items-center">
                 <AlertCircle className="w-3 h-3 mr-1" />
                 {errors.products.message || "Pelo menos um produto é obrigatório."}
             </p>
         )}
      </div>

      <Separator />

      {/* SECTIONS 3 & 4: COSTS & SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: CUSTOS E DEDUÇÕES */}
          <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  CUSTOS E DEDUÇÕES
              </h3>
              
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/40 border border-border/60 rounded-lg">
                  <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">COMISSÃO (OPCIONAL)</Label>
                      <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="pl-8 bg-background"
                              step="0.01"
                              {...register('commission_value')}
                          />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">DESCONTO / OUTROS (OPCIONAL)</Label>
                      <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="pl-8 bg-background"
                              step="0.01"
                              {...register('other_costs')}
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                           <Label className="text-xs text-muted-foreground">TIPO IMPOSTO</Label>
                           {/* Using controlled Select with value prop to reflect form state updates */}
                           <Select 
                              onValueChange={(val) => setValue('tax_type', val)} 
                              value={taxType}
                           >
                               <SelectTrigger className="bg-background">
                                   <SelectValue placeholder="Selecione" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="fixed">Fixo (R$)</SelectItem>
                                   <SelectItem value="percentage">Percentual (%)</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                       <div className="space-y-1.5">
                           <Label className="text-xs text-muted-foreground">VALOR IMPOSTO</Label>
                           <div className="relative">
                               <Input 
                                   type="number" 
                                   placeholder="0" 
                                   step="0.01"
                                   className="bg-background"
                                   {...register('tax_amount')}
                               />
                           </div>
                       </div>
                  </div>
              </div>
          </div>

          {/* RIGHT: RESUMO FINANCEIRO */}
          <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  RESUMO FINANCEIRO
              </h3>

              <div className="bg-muted/10 rounded-lg border p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Faturamento (Subtotal)</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                       <span>Custo Produtos (CMV)</span>
                       <span>- {formatCurrency(totalCost)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-foreground pt-1 border-t border-dashed">
                       <span>Lucro Bruto</span>
                       <span>{formatCurrency(grossProfit)}</span>
                  </div>

                  <Separator className="my-2 bg-border/50" />

                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Deduções</p>
                    <div className="flex justify-between items-center text-xs text-red-500/80">
                        <span>Comissão</span>
                        <span>- {formatCurrency(Number(commission))}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-red-500/80">
                        <span>Descontos / Outros</span>
                        <span>- {formatCurrency(Number(otherCosts))}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-red-500/80">
                        <span>Impostos ({taxType === 'percentage' ? `${taxAmount}%` : 'Fixo'})</span>
                        <span>- {formatCurrency(calculatedTaxValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-red-600 border-t border-red-200/50 pt-1 mt-1">
                        <span>Total Deduções</span>
                        <span>- {formatCurrency(totalDeductions)}</span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center bg-background p-2 rounded border shadow-sm">
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">LUCRO LÍQUIDO</span>
                          <span className={`text-xs ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                             Margem: {margin.toFixed(1)}%
                          </span>
                      </div>
                      <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)}
                      </span>
                  </div>
              </div>
          </div>
      </div>

      <Separator />

      {/* SECTION 5: CONDIÇÕES DE PAGAMENTO */}
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-primary">Condições de Pagamento</h3>
                  <p className="text-xs text-muted-foreground">Configurar parcelamento desta venda</p>
              </div>
              <div className="flex items-center gap-2">
                  <Label htmlFor="installments-mode" className="text-sm">Parcelado?</Label>
                  <Switch 
                      id="installments-mode"
                      checked={isInstallment}
                      onCheckedChange={(checked) => {
                          setIsInstallment(checked);
                          if (!checked) {
                              setValue('installments_count', 1);
                              setValue('first_installment_date', null);
                          } else {
                              setValue('installments_count', 2); // Default to 2 if enabling
                          }
                      }}
                  />
              </div>
          </div>

          {isInstallment && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
                  <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nº Parcelas</Label>
                      <Input 
                          type="number" 
                          min="2" 
                          max="24"
                          {...register('installments_count', { valueAsNumber: true })}
                      />
                  </div>
                  <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Data 1ª Parcela</Label>
                      <div className="relative">
                          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                              type="date"
                              className="pl-8"
                              {...register('first_installment_date')}
                          />
                      </div>
                  </div>
              </div>
          )}
      </div>

    </div>
  );
};