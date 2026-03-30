import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSalesActivitySchema } from './add-sales-activity/lib/validation';
import { useSalesActivityForm } from './add-sales-activity/hooks/useSalesActivityForm';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, startOfDay, format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import RefillPromptDialog from './add-sales-activity/RefillPromptDialog';
import CustomerDuplicateDialog from './add-sales-activity/CustomerDuplicateDialog';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import { checkCustomerExists } from '@/lib/customerDeduplication';
import { useLocalization } from '@/contexts/LocalizationContext';
import SchedulingMessageComponent from './add-sales-activity/SchedulingMessageComponent';

// Direct imports of form fields
import { CustomerFormFields } from './add-sales-activity/CustomerFormFields';
import { ActivityFormFields } from './add-sales-activity/ActivityFormFields';
import { SaleDetailsFormFields } from './add-sales-activity/SaleDetailsFormFields';

const steps = [
  { label: "customer", id: 0 },
  { label: "activity_type", id: 1 }, 
  { label: "sales", id: 2 }, 
];

const FIELD_LABELS = {
  customer_name: "Nome do Cliente",
  customer_id: "Cliente",
  visit_date: "Data da Visita",
  visit_time: "Horário da Visita",
  status: "Status",
  activity_type: "Tipo de Atividade",
  products: "Produtos",
  // estimated_value removed as it is now optional
};

const AddSalesActivityModal = ({ isOpen, onClose, onActivityAdded, activityData, products }) => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refillPromptOpen, setRefillPromptOpen] = useState(false);
  const [refillData, setRefillData] = useState(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [foundDuplicateCustomer, setFoundDuplicateCustomer] = useState(null);
  const [pendingSubmissionData, setPendingSubmissionData] = useState(null);
  const [lastSavedActivity, setLastSavedActivity] = useState(null);

  const getInitialState = useCallback(() => {
    const now = new Date(); 
    return {
      customer_id: null,
      customer_name: '',
      customer_cpf_cnpj: '',
      customer_phone: '',
      customer_email: '',
      customer_cep: '',
      customer_address: '',
      customer_address_number: '',
      customer_address_complement: '',
      customer_address_neighborhood: '',
      customer_address_city: '',
      customer_address_state: '',
      customer_birth_date: '',
      is_new_customer: true,
      use_conexzap_webhook: false,
      status: 'scheduled',
      visit_date: format(startOfDay(now), 'yyyy-MM-dd'),
      visit_time: format(now, 'HH:mm'),
      consultant_name: user?.name || '',
      notes: '',
      activity_type: 'negocio',
      visits_count: 1, 
      sale_made: false,
      estimated_value: '', 
      
      // Intelligence defaults
      pathology: '',
      objections: '',
      potential_products: '',
      
      sale_value: 0,
      commission_value: '',
      other_costs: '',
      tax_amount: '',
      tax_type: 'fixed', // Default tax type
      products: [],
      custom_data: { ein: '' },
      
      installments_count: 1,
      first_installment_date: null
    };
  }, [user]);

  const schema = getSalesActivitySchema(user?.region);
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: getInitialState(),
    mode: 'onChange'
  });

  const { handleSubmit, trigger, watch, reset, setValue, getValues, formState: { errors } } = methods;
  const status = watch('status');
  const watchProducts = watch('products');
  
  const { saveActivity, scheduleRefillActivity } = useSalesActivityForm(user, onActivityAdded, activityData?.id);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
        // Debugging logs to verify product reception
        // console.log("AddSalesActivityModal OPEN. Products count:", products?.length);

        if (activityData) {
            console.log("Opening modal in EDIT mode for ID:", activityData.id);
            // console.log("Activity Data loaded:", activityData);
            
            reset({
              ...getInitialState(),
              ...activityData,
              customer_id: activityData.customer_id,
              is_new_customer: !activityData.customer_id,
              
              visit_date: activityData.visit_date ? format(parseISO(activityData.visit_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              visit_time: activityData.visit_time ? activityData.visit_time.slice(0, 5) : format(new Date(), 'HH:mm'),
              
              pathology: activityData.pathology || '',
              objections: activityData.objections || '',
              potential_products: activityData.potential_products || '',
              estimated_value: activityData.estimated_value || '',
              
              commission_value: activityData.commission_value === null ? '' : activityData.commission_value,
              other_costs: activityData.other_costs === null ? '' : activityData.other_costs,
              tax_amount: activityData.tax_amount === null ? '' : activityData.tax_amount,
              // Explicitly handle tax_type to default to 'fixed' if null/undefined in DB
              tax_type: activityData.tax_type || 'fixed',
              
              visits_count: activityData.visits_count || 1,
              
              installments_count: activityData.installments_count || 1,
              first_installment_date: activityData.first_installment_date || null,
              
              products: activityData.opportunity_products ? activityData.opportunity_products.map(op => ({
                product_id: op.product_id,
                quantity_sold: op.quantity_sold,
                unit_sale_price_at_sale: op.unit_sale_price_at_sale,
                unit_cost_price_at_sale: op.unit_cost_price_at_sale || 0
              })) : [],
            });
        } else {
            console.log("Opening modal in CREATE mode");
            reset(getInitialState());
        }
        setCurrentStep(0);
        setIsSubmitting(false);
        setRefillPromptOpen(false);
        setLastSavedActivity(null);
    }
  }, [isOpen, activityData, reset, user, getInitialState, products]);

  const onError = (errors) => {
    console.error("❌ Form Submission Error (Validation):", errors);
    
    // Extract field names and map to human readable labels
    const errorFields = Object.keys(errors)
      .map(field => FIELD_LABELS[field] || field)
      .join(', ');

    toast({
      title: "Campos obrigatórios faltando",
      description: errorFields ? `Verifique: ${errorFields}` : "Por favor, preencha todos os campos obrigatórios marcados em vermelho.",
      variant: "destructive",
      duration: 5000,
    });
  };

  const onSubmit = async (data) => {
      console.log("🚀 onSubmit triggered with data:", data);
      
      if (isSubmitting) return;

      // Final Stock Validation
      if (data.status === 'sale_made' && data.products && data.products.length > 0) {
          for (const item of data.products) {
              const product = products.find(p => p.id === item.product_id);
              if (product && product.quantity_in_stock < Number(item.quantity_sold)) {
                  toast({
                      title: "Erro de Estoque",
                      description: `Estoque insuficiente para "${product.name}". Disponível: ${product.quantity_in_stock}.`,
                      variant: "destructive"
                  });
                  return;
              }
          }
      }

      setIsSubmitting(true);
      try {
          // Prepare dates
          const visitDateStr = data.visit_date; // YYYY-MM-DD
          const visitTimeStr = data.visit_time; // HH:mm
          // Create date object safely
          const visitDateObj = new Date(visitDateStr + 'T' + visitTimeStr);
          
          const postSaleFollowUpDueDate = addDays(visitDateObj, 15);
          const cleaningAndReferralsDueDate = addDays(visitDateObj, 60);
          
          const submissionData = {
              ...data,
              // Cleanup customer ID if new
              customer_id: data.is_new_customer ? null : data.customer_id,
              // Ensure numeric values
              sale_value: Number(data.sale_value || 0),
          };

          const result = await saveActivity(submissionData, postSaleFollowUpDueDate, cleaningAndReferralsDueDate);
          
          if (result && result.success) {
              setLastSavedActivity({ date: data.visit_date, time: data.visit_time });

              if (result.refillPromptData) {
                  setRefillData(result.refillPromptData);
                  setRefillPromptOpen(true);
              } else {
                  // Wait a bit for the toast to be readable
                  setTimeout(() => handleCloseAndReset(), 1500);
              }
          } else {
              // Handle case where saveActivity returns success: false with message
               if (result && result.message) {
                   toast({ 
                      title: "Erro ao salvar", 
                      description: result.message, 
                      variant: "destructive" 
                  });
               }
          }
      } catch (error) {
          console.error("❌ Submission error details:", error);
          const { isDuplicate } = handleSupabaseError(error);
          
          if (isDuplicate && data.is_new_customer) {
              try {
                  // Quick check to see WHO is the duplicate
                  const checkResult = await checkCustomerExists({
                      name: data.customer_name,
                      phone: data.customer_phone,
                      distributorId: user.id
                  });
                  if (checkResult.exists && checkResult.customer) {
                      setFoundDuplicateCustomer(checkResult.customer);
                      setPendingSubmissionData(data);
                      setDuplicateDialogOpen(true);
                  } else {
                      toast({ 
                          title: t('error'), 
                          description: "Cliente duplicado detectado.", 
                          variant: "destructive" 
                      });
                  }
              } catch (e) { console.error(e); }
          } else {
              toast({ 
                  title: t('error'), 
                  description: error.message || "Erro ao salvar atividade.", 
                  variant: "destructive" 
              });
          }
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCloseAndReset = () => {
      onClose();
      // Delay reset to allow dialog close animation
      setTimeout(() => {
        reset(getInitialState());
        setCurrentStep(0);
        setLastSavedActivity(null);
      }, 300);
  };

  const handleUseExistingCustomer = async (existingCustomer) => {
      if (!pendingSubmissionData) return;
      setDuplicateDialogOpen(false);
      
      setValue('customer_id', existingCustomer.id);
      setValue('is_new_customer', false);
      
      const updatedData = { 
          ...pendingSubmissionData, 
          customer_id: existingCustomer.id, 
          is_new_customer: false 
      };
      
      // Retry submission with corrected data
      await onSubmit(updatedData);
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (currentStep === 0) {
        const isNew = methods.getValues('is_new_customer');
        fieldsToValidate = isNew 
            ? ['customer_name', 'customer_phone'] 
            : ['customer_id'];
    }
    if (currentStep === 1) {
        fieldsToValidate = ['visit_date', 'visit_time', 'consultant_name', 'status', 'activity_type'];
        // estimated_value removed from required validation list
    }
    
    // console.log(`Checking validation for step ${currentStep}:`, fieldsToValidate);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      // Logic: If status implies sale, continue to step 2. Else submit at step 1.
      if (currentStep === 1 && status !== 'sale_made') {
        handleSubmit(onSubmit, onError)(); // Trigger submit
      } else if (currentStep < (status === 'sale_made' ? 2 : 1)) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
        // Find which fields failed in the current step to show specific toast
        const currentErrors = methods.formState.errors;
        const failedFields = fieldsToValidate.filter(field => currentErrors[field]);
        
        if (failedFields.length > 0) {
            const errorLabels = failedFields.map(f => FIELD_LABELS[f] || f).join(', ');
            toast({ 
                title: "Campos obrigatórios", 
                description: `Por favor preencha: ${errorLabels}`, 
                variant: "destructive" 
            });
        } else {
            toast({ title: t('warning'), description: "Preencha os campos obrigatórios para continuar.", variant: "destructive" });
        }
    }
  };

  const maxSteps = status === 'sale_made' ? 3 : 2;
  // Disable save if we are on the sale step but no products are added
  const isSaveDisabled = isSubmitting || (status === 'sale_made' && currentStep === 2 && (!watchProducts || watchProducts.length === 0));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(val) => { if (!isSubmitting) onClose(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border rounded-xl shadow-2xl">
          <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/5 to-purple-500/5 flex justify-between items-center">
            <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                    {activityData ? t('edit_activity') : t('new_activity')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                    {currentStep + 1} de {maxSteps} - {t(steps[currentStep].label)}
                </DialogDescription>
            </div>
            <div className="flex gap-1">
                {Array.from({length: maxSteps}).map((_, idx) => (
                    <div key={idx} className={`h-1.5 w-6 rounded-full transition-colors ${idx <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                ))}
            </div>
          </div>

          <FormProvider {...methods}>
            <form className="flex-grow flex flex-col overflow-hidden bg-gradient-to-br from-background to-muted/20">
              <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-6">
                {lastSavedActivity && !refillPromptOpen && (
                   <SchedulingMessageComponent date={lastSavedActivity.date} time={lastSavedActivity.time} />
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>}>
                      {currentStep === 0 && <CustomerFormFields region={user?.region} />}
                      {currentStep === 1 && <ActivityFormFields />}
                      {currentStep === 2 && <SaleDetailsFormFields availableProducts={products} />}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="px-6 py-4 border-t bg-background flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 0 || isSubmitting} className="gap-2">
                  <ArrowLeft className="w-4 h-4"/> {t('back')}
                </Button>
                
                {/* 
                  Logic for "Salvar Atividade" vs "Next":
                  - If we are at the last step (maxSteps - 1), show Save.
                  - If we are at Step 1 AND status is NOT 'sale_made', we consider this the end, show Save.
                */}
                {(currentStep === maxSteps - 1) || (currentStep === 1 && status !== 'sale_made') ? (
                   <Button 
                      type="button" 
                      onClick={handleSubmit(onSubmit, onError)} 
                      disabled={isSaveDisabled} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[140px]"
                    >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                     {isSubmitting ? t('saving') : t('save_activity')}
                   </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="gap-2 min-w-[120px]"
                  >
                    {t('next')} <ArrowRight className="w-4 h-4"/>
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <RefillPromptDialog 
        open={refillPromptOpen} 
        onOpenChange={(val) => {
            setRefillPromptOpen(val);
            if (!val) handleCloseAndReset();
        }} 
        refillData={refillData} 
        onConfirm={(d) => { 
            // If user confirms, pass the date. scheduleRefillActivity will use it or default.
            // Note: RefillPromptDialog usually returns a date if the user selected one, or null.
            // Pass it through.
            scheduleRefillActivity(refillData, d); 
            setRefillPromptOpen(false); 
            handleCloseAndReset(); 
        }} 
      />
      
      <CustomerDuplicateDialog 
        isOpen={duplicateDialogOpen} 
        onOpenChange={setDuplicateDialogOpen} 
        existingCustomer={foundDuplicateCustomer} 
        onConfirmUseExisting={handleUseExistingCustomer} 
        onCancel={() => setDuplicateDialogOpen(false)} 
      />
    </>
  );
};

export default AddSalesActivityModal;