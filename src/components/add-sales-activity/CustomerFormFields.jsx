import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import InputMask from 'react-input-mask';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  MapPin, User, Search, Loader2, Check, ChevronsUpDown, UserPlus, Users
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { checkCustomerExists } from '@/lib/customerDeduplication';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatSSN, formatEIN, formatZIPCode } from '@/lib/utils';
import { useExistingCustomers } from '@/hooks/useExistingCustomers';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import { useLocalization } from '@/contexts/LocalizationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const USA_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function CustomerFormFields({ region }) {
  const { control, register, setValue, formState: { errors }, watch } = useFormContext();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const { user } = useAuth();
  const { t } = useLocalization();
  
  const { customers, searchResults, loading: loadingCustomers, searchCustomers } = useExistingCustomers();
  
  const currentRegion = region || user?.region || 'BR';
  const isUSA = currentRegion === 'USA';

  const isNewCustomer = watch('is_new_customer');
  const selectedCustomerId = watch('customer_id');

  // Debug logging for field values
  const watchedCpf = watch('customer_cpf_cnpj');
  const watchedPhone = watch('customer_phone');
  
  useEffect(() => {
    if (watchedCpf || watchedPhone) {
      console.log('🔍 [CustomerFormFields] Field Update:', { 
        cpf: watchedCpf, 
        phone: watchedPhone 
      });
    }
  }, [watchedCpf, watchedPhone]);

  const handleCepBlur = async (e) => {
    if (isUSA) return;
    
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setValue('customer_address', data.logradouro, { shouldValidate: true });
          setValue('customer_address_neighborhood', data.bairro, { shouldValidate: true });
          setValue('customer_address_city', data.localidade, { shouldValidate: true });
          setValue('customer_address_state', data.uf, { shouldValidate: true });
          
          toast({
            title: t('address_found'),
            description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          });
          
          setTimeout(() => document.getElementById('customer_address_number')?.focus(), 100);
        } else {
           toast({ title: t('zip_not_found'), description: "Verifique o CEP digitado.", variant: "destructive" });
        }
      } catch (error) {
        console.error("CEP error", error);
        toast({ title: t('error'), description: "Tente novamente mais tarde.", variant: "destructive" });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleDuplicateCheck = async (field, value) => {
      if (!isNewCustomer || !value || value.length < 4 || !user?.id) return;
      
      setIsCheckingDuplicate(true);
      try {
          const params = { distributorId: user.id };
          if (field === 'name') params.name = value;
          if (field === 'phone') params.phone = value;

          const result = await checkCustomerExists(params);
          
          if (result.exists) {
              toast({
                  title: t('warning'),
                  description: t('customer_exists_warning'),
                  variant: "warning",
                  className: "bg-amber-500 border-none text-white"
              });
          }
      } catch (error) {
          console.error("Check duplicate error", error);
      } finally {
          setIsCheckingDuplicate(false);
      }
  };

  const handleCustomerSelect = (customer) => {
    setOpenCombobox(false);
    setValue('customer_id', customer.id);
    setValue('is_new_customer', false);
    
    console.log("👤 Customer Selected:", customer);
    
    // Auto-populate fields
    setValue('customer_name', customer.name || '');
    setValue('customer_email', customer.email || '');
    setValue('customer_phone', customer.phone || '');
    setValue('customer_cpf_cnpj', customer.cpf_cnpj || '');
    setValue('customer_birth_date', customer.birth_date || '');
    
    setValue('customer_cep', customer.zip_code || '');
    setValue('customer_address', customer.address || '');
    setValue('customer_address_number', customer.address_number || '');
    setValue('customer_address_complement', customer.address_complement || '');
    setValue('customer_address_neighborhood', customer.address_neighborhood || '');
    setValue('customer_address_city', customer.address_city || '');
    setValue('customer_address_state', customer.address_state || '');

    if (isUSA && customer.custom_data?.ein) {
        setValue('custom_data.ein', customer.custom_data.ein);
    }
    
    toast({
        title: t('success'),
        description: t('customer') + " " + t('selected_customer'), 
    });
  };

  const handleModeChange = (val) => {
      const isNew = val === 'new';
      setValue('is_new_customer', isNew);
      if (isNew) {
          setValue('customer_id', null);
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SELECTION MODE */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
        <RadioGroup 
            defaultValue={isNewCustomer ? "new" : "existing"} 
            onValueChange={handleModeChange}
            className="flex flex-col sm:flex-row gap-4"
        >
            <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all flex-1 ${isNewCustomer ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-background hover:bg-muted/50'}`}>
                <RadioGroupItem value="new" id="mode-new" />
                <Label htmlFor="mode-new" className="flex items-center gap-2 cursor-pointer font-medium w-full">
                    <UserPlus className="w-4 h-4 text-primary" />
                    {t('create_customer')}
                </Label>
            </div>
            <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all flex-1 ${!isNewCustomer ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-background hover:bg-muted/50'}`}>
                <RadioGroupItem value="existing" id="mode-existing" />
                <Label htmlFor="mode-existing" className="flex items-center gap-2 cursor-pointer font-medium w-full">
                    <Users className="w-4 h-4 text-emerald-500" />
                    {t('select_customer')}
                </Label>
            </div>
        </RadioGroup>
      </div>

      {/* 2. EXISTING SELECTOR */}
      {!isNewCustomer && (
        <div className="space-y-2 animate-in fade-in zoom-in duration-300">
             <Label className="flex items-center gap-2 font-medium">
                 <Search className="w-4 h-4 text-primary" /> 
                 {t('find_customer')}
             </Label>
             <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between h-11 text-left font-normal"
                    >
                        {selectedCustomerId
                            ? customers.find((c) => c.id === selectedCustomerId)?.name || t('select_customer')
                            : t('search')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput 
                            placeholder={t('search') + "..."} 
                            onValueChange={searchCustomers}
                        />
                        <CommandList>
                            <CommandEmpty>{loadingCustomers ? t('loading') : t('no_products')}</CommandEmpty>
                            <CommandGroup>
                                {searchResults.map((customer) => (
                                    <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={() => handleCustomerSelect(customer)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{customer.name}</span>
                                            <span className="text-xs text-muted-foreground">{customer.email || customer.phone || 'Sem contato'}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
      )}

      {/* 3. BASIC INFO GROUP */}
      <div className={`space-y-4 transition-opacity duration-300 ${!isNewCustomer && !selectedCustomerId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 pb-2 border-b">
              <User className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-foreground">{t('full_name')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NAME */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer_name" className="text-xs font-semibold uppercase text-muted-foreground">
                 {t('full_name')} <span className="text-destructive">*</span>
                 {isCheckingDuplicate && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
              </Label>
              <Input 
                id="customer_name" 
                {...register("customer_name", { onBlur: (e) => handleDuplicateCheck('name', e.target.value) })} 
                className={errors.customer_name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.customer_name && <span className="text-xs text-destructive">{errors.customer_name.message}</span>}
            </div>

            {/* CPF/CNPJ or SSN */}
            <div className="space-y-2">
              <Label htmlFor="customer_cpf_cnpj" className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('cpf_cnpj')} {!isUSA && <span className="text-destructive">*</span>}
              </Label>
              <Controller
                name="customer_cpf_cnpj"
                control={control}
                render={({ field }) => (
                  isUSA ? (
                    <Input 
                        {...field} 
                        onChange={(e) => {
                            console.log("🇺🇸 SSN Capture:", e.target.value);
                            field.onChange(formatSSN(e.target.value));
                        }} 
                        placeholder="XXX-XX-XXXX" 
                    />
                  ) : (
                    <InputMask 
                        mask={field.value?.length > 14 ? "99.999.999/9999-99" : "999.999.999-999"} 
                        maskChar={null} 
                        value={field.value || ''} 
                        onChange={(e) => {
                            const val = e.target.value;
                            console.log("🇧🇷 CPF/CNPJ Capture:", val);
                            field.onChange(val);
                        }}
                        onBlur={field.onBlur}
                    >
                        {(inputProps) => (
                          <Input 
                            {...inputProps} 
                            id="customer_cpf_cnpj" 
                            placeholder="000.000.000-00" 
                            className={errors.customer_cpf_cnpj ? "border-destructive" : ""} 
                          />
                        )}
                    </InputMask>
                  )
                )}
              />
              {errors.customer_cpf_cnpj && <span className="text-xs text-destructive">{errors.customer_cpf_cnpj.message}</span>}
            </div>

             {/* EMAIL */}
            <div className="space-y-2">
                <Label htmlFor="customer_email" className="text-xs font-semibold uppercase text-muted-foreground">{t('email')}</Label>
                <Input id="customer_email" type="email" {...register("customer_email")} placeholder="exemplo@email.com" />
            </div>

            {/* PHONE */}
             <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('phone')} {!isUSA && <span className="text-destructive">*</span>}
                </Label>
                <Controller
                    name="customer_phone"
                    control={control}
                    render={({ field }) => (
                         isUSA ? (
                             <Input 
                                {...field} 
                                placeholder="+1 (XXX) XXX-XXXX" 
                                className={errors.customer_phone ? "border-destructive" : ""} 
                                onChange={(e) => {
                                    console.log("🇺🇸 Phone Capture:", e.target.value);
                                    field.onChange(e.target.value);
                                }} 
                                onBlur={(e) => { field.onBlur(); handleDuplicateCheck('phone', e.target.value); }} 
                             />
                         ) : (
                             <InputMask 
                                mask="(99) 99999-9999" 
                                maskChar={null} 
                                value={field.value || ''} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    console.log("🇧🇷 Phone Capture:", val);
                                    field.onChange(val);
                                }}
                                onBlur={(e) => { field.onBlur(); handleDuplicateCheck('phone', e.target.value); }}
                             >
                                {(inputProps) => (
                                  <Input 
                                    {...inputProps} 
                                    id="customer_phone" 
                                    placeholder="(00) 90000-0000" 
                                    className={errors.customer_phone ? "border-destructive" : ""} 
                                  />
                                )}
                             </InputMask>
                         )
                    )}
                />
                {errors.customer_phone && <span className="text-xs text-destructive">{errors.customer_phone.message}</span>}
            </div>

             {/* BIRTH DATE */}
            <div className="space-y-2">
                <Label htmlFor="customer_birth_date" className="text-xs font-semibold uppercase text-muted-foreground">{t('birth_date')}</Label>
                <Input id="customer_birth_date" type="date" {...register("customer_birth_date")} />
            </div>
            
             {/* EIN (USA Only) */}
             {isUSA && (
                <div className="space-y-2">
                    <Label htmlFor="custom_data.ein" className="text-xs font-semibold uppercase text-muted-foreground">{t('ein')} (Optional)</Label>
                    <Controller name="custom_data.ein" control={control} render={({field}) => (
                        <Input {...field} onChange={(e) => field.onChange(formatEIN(e.target.value))} placeholder="XX-XXXXXXX" />
                    )} />
                </div>
            )}
          </div>
      </div>

      {/* 4. ADDRESS GROUP (REORDERED) */}
      <div className={`space-y-4 transition-opacity duration-300 ${!isNewCustomer && !selectedCustomerId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 pb-2 border-b">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">{t('address')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
           {/* CEP / ZIP (Moved to start) */}
           <div className="md:col-span-4 space-y-2">
              <Label htmlFor="customer_cep" className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('zip')} {!isUSA && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Controller
                  name="customer_cep"
                  control={control}
                  render={({ field }) => (
                     isUSA ? (
                        <Input {...field} onChange={(e) => field.onChange(formatZIPCode(e.target.value))} placeholder="00000" />
                     ) : (
                        <InputMask mask="99999-999" maskChar={null} value={field.value || ''} onChange={field.onChange} onBlur={handleCepBlur}>
                            {(inputProps) => <Input {...inputProps} id="customer_cep" placeholder="00000-000" className="pr-8" />}
                        </InputMask>
                     )
                  )}
                />
                {!isUSA && <div className="absolute right-3 top-2.5 text-muted-foreground">{isLoadingCep ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}</div>}
              </div>
              {errors.customer_cep && <span className="text-xs text-destructive">{errors.customer_cep.message}</span>}
           </div>
           
           {/* Spacer */}
           <div className="md:col-span-8"></div>

           {/* Street */}
           <div className="md:col-span-9 space-y-2">
              <Label htmlFor="customer_address" className="text-xs font-semibold uppercase text-muted-foreground">{t('street')}</Label>
              <Input id="customer_address" {...register("customer_address")} />
           </div>
           
           {/* Number */}
           <div className="md:col-span-3 space-y-2">
              <Label htmlFor="customer_address_number" className="text-xs font-semibold uppercase text-muted-foreground">{t('number')}</Label>
              <Input id="customer_address_number" {...register("customer_address_number")} />
           </div>

           {/* Complement */}
           <div className="md:col-span-6 space-y-2">
              <Label htmlFor="customer_address_complement" className="text-xs font-semibold uppercase text-muted-foreground">{t('complement')}</Label>
              <Input id="customer_address_complement" {...register("customer_address_complement")} placeholder={isUSA ? "Unit 101" : "Ex: Apto 101"} />
           </div>

           {/* District */}
           <div className="md:col-span-6 space-y-2">
              <Label htmlFor="customer_address_neighborhood" className="text-xs font-semibold uppercase text-muted-foreground">{t('neighborhood')}</Label>
              <Input id="customer_address_neighborhood" {...register("customer_address_neighborhood")} />
           </div>

           {/* City */}
           <div className="md:col-span-6 space-y-2">
               <Label htmlFor="customer_address_city" className="text-xs font-semibold uppercase text-muted-foreground">{t('city')}</Label>
               <Input id="customer_address_city" {...register("customer_address_city")} className="bg-muted/20" />
           </div>

           {/* State */}
           <div className="md:col-span-2 space-y-2">
               <Label htmlFor="customer_address_state" className="text-xs font-semibold uppercase text-muted-foreground">{t('state')}</Label>
               {isUSA ? (
                 <Controller
                    name="customer_address_state"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-muted/20"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {USA_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                 />
               ) : (
                 <Input id="customer_address_state" {...register("customer_address_state")} maxLength={2} className="uppercase bg-muted/20" />
               )}
           </div>

        </div>
      </div>

    </div>
  );
}