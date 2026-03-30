import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addMonths, parseISO, addDays, isValid } from 'date-fns';

export const useSalesActivityForm = (user, onActivityAdded, activityId = null) => {

  const REFILL_PRODUCTS = ["ara", "jarra", "alcaline", "agua", "água", "refil", "elemento", "filtrante"];

  const saveActivity = useCallback(async (formData, postSaleFollowUpDueDate, cleaningAndReferralsDueDate) => {
    
    console.group("🚀 START saveActivity Hook");
    console.log("Payload received (Form Data):", formData);

    if (!user) {
      console.error("❌ User not authenticated in useSalesActivityForm");
      console.groupEnd();
      return { success: false, message: "Usuário não autenticado." };
    }

    // Defensive validation inside the hook
    const missingFields = [];
    if (formData.is_new_customer && !formData.customer_name) missingFields.push("Nome do Cliente");
    if (!formData.is_new_customer && !formData.customer_id) missingFields.push("Cliente Selecionado");
    if (!formData.visit_date) missingFields.push("Data da Visita");
    if (!formData.visit_time) missingFields.push("Horário da Visita");
    if (!formData.status) missingFields.push("Status");
    if (!formData.activity_type) missingFields.push("Tipo de Atividade");

    if (missingFields.length > 0) {
      const errorMsg = `Campos obrigatórios faltando: ${missingFields.join(', ')}`;
      console.error("❌ Validation Error in Hook:", errorMsg);
      console.groupEnd();
      return { success: false, missingFields, message: errorMsg };
    }

    try {
      let customerId = formData.customer_id;
      
      const sanitize = (val) => (val && typeof val === 'string' && val.trim() !== '' ? val.trim() : null);
      const sanitizeDigits = (val) => (val ? String(val).replace(/\D/g, '') : null);
      const sanitizeNumber = (val) => {
        if (val === '' || val === null || val === undefined) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      console.log("📋 Processing CPF and Phone:");
      console.log("   - Raw CPF/CNPJ from form:", formData.customer_cpf_cnpj);
      console.log("   - Raw Phone from form:", formData.customer_phone);

      // Cleaned values for consistency
      // NOTE: We strip non-digits for CPF/CNPJ consistency
      const cleanCpf = sanitizeDigits(formData.customer_cpf_cnpj);
      
      // For phone, we often want to keep formatting or at least pass what was typed
      // However, usually DB expects either raw string or digits. 
      // Let's pass the raw string if present, or digits if preferred.
      // Existing customers usually have formatted strings in 'phone' column.
      const finalPhone = formData.customer_phone; 
      
      console.log("   - Cleaned CPF for DB:", cleanCpf);
      console.log("   - Final Phone for DB:", finalPhone);

      // 1. Prepare Customer Data (for Direct Customer Table Update/Insert)
      const customerData = {
        name: sanitize(formData.customer_name),
        cpf_cnpj: cleanCpf, 
        phone: finalPhone, 
        email: sanitize(formData.customer_email),
        birth_date: formData.customer_birth_date ? sanitize(formData.customer_birth_date) : null,
        address: sanitize(formData.customer_address),
        address_number: sanitize(formData.customer_address_number),
        address_complement: sanitize(formData.customer_address_complement),
        address_neighborhood: sanitize(formData.customer_address_neighborhood),
        address_city: sanitize(formData.customer_address_city),
        address_state: sanitize(formData.customer_address_state),
        zip_code: sanitizeDigits(formData.customer_cep),
        company: sanitize(formData.customer_company),
        position: sanitize(formData.customer_position),
        custom_data: formData.custom_data
      };
      
      console.log("📝 Customer Data Prepared for Persistence:", customerData);

      // CUSTOMER SYNC LOGIC: Create or Update Customer
      if (customerId) {
          // UPDATE EXISTING CUSTOMER
          console.log("🔄 Updating existing customer:", customerId);
          const { error: updateError } = await supabase
            .from('customers')
            .update({
                ...customerData,
                updated_at: new Date(),
                last_activity_date: new Date()
            })
            .eq('id', customerId);
            
          if (updateError) {
              console.error("⚠️ Error updating customer (non-blocking):", updateError);
              toast({ title: "Aviso", description: "Erro ao atualizar dados do cliente, mas a atividade será salva.", variant: "warning" });
          } else {
              console.log("✅ Customer updated successfully.");
          }
      } else if (customerData.name) {
          // CREATE NEW CUSTOMER (or find duplicate)
          console.log("🔍 Checking/Creating new customer...");
          
          const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('distributor_id', user.id)
            .ilike('name', customerData.name)
            .maybeSingle();

          if (existing) {
             console.log("✅ Customer already exists by name, using ID:", existing.id);
             customerId = existing.id;
             const { error: updateError } = await supabase.from('customers').update({ ...customerData, updated_at: new Date() }).eq('id', customerId);
             if (updateError) console.error("Error updating existing customer:", updateError);

          } else {
             const { data: newCust, error: createError } = await supabase
                .from('customers')
                .insert({
                    ...customerData,
                    distributor_id: user.id,
                    created_at: new Date(),
                    last_activity_date: new Date()
                })
                .select('id')
                .single();
             
             if (createError) {
                 console.error("❌ Error creating customer:", createError);
                 throw new Error("Erro ao criar cliente: " + createError.message);
             }
             customerId = newCust.id;
             console.log("✅ New customer created with ID:", customerId);
          }
      }

      // 2. Prepare Opportunity Data
      const productsList = Array.isArray(formData.products) ? formData.products : [];
      const grossSale = formData.status === 'sale_made' ? sanitizeNumber(formData.sale_value) : null;
      
      let netProfitCalculated = null;
      let calculatedTaxAmount = sanitizeNumber(formData.tax_amount);
      const commissionValue = sanitizeNumber(formData.commission_value);
      const otherCosts = sanitizeNumber(formData.other_costs);
      const taxType = formData.tax_type || 'fixed';

      if (formData.status === 'sale_made' && grossSale !== null) {
          const totalProductCost = productsList.reduce((acc, p) => {
              return acc + (sanitizeNumber(p.quantity_sold) * sanitizeNumber(p.unit_cost_price_at_sale));
          }, 0);
          
          let taxValueDeduction = 0;
          if (taxType === 'percentage') {
             taxValueDeduction = grossSale * (calculatedTaxAmount / 100);
          } else {
             taxValueDeduction = calculatedTaxAmount;
          }
          netProfitCalculated = grossSale - totalProductCost - commissionValue - otherCosts - taxValueDeduction;
      }

      // Ensure we send ALL fields for the trigger to pick up and sync
      const opportunityData = {
        distributor_id: user.id,
        customer_id: customerId,
        customer_name: customerData.name,
        // CRITICAL: Passing strict phone and cpf/cnpj to ensure trigger updates customer table correctly
        customer_phone: customerData.phone, 
        customer_email: customerData.email,
        customer_address: customerData.address,
        customer_address_number: customerData.address_number,
        customer_address_complement: customerData.address_complement,
        customer_address_neighborhood: customerData.address_neighborhood,
        customer_address_city: customerData.address_city,
        customer_address_state: customerData.address_state,
        customer_cep: customerData.zip_code,
        customer_cpf_cnpj: customerData.cpf_cnpj,
        
        status: formData.status,
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        consultant_name: formData.consultant_name,
        notes: formData.notes,
        activity_type: formData.activity_type,
        
        pathology: sanitize(formData.pathology),
        objections: sanitize(formData.objections),
        potential_products: sanitize(formData.potential_products),
        estimated_value: sanitizeNumber(formData.estimated_value),
        visits_count: sanitizeNumber(formData.visits_count) || 1,
        
        sale_value: grossSale,
        commission_value: commissionValue,
        other_costs: otherCosts,
        tax_amount: calculatedTaxAmount, 
        tax_type: taxType,
        net_profit_calculated: netProfitCalculated,
        
        installments_count: sanitizeNumber(formData.installments_count),
        first_installment_date: formData.first_installment_date || null,
        
        updated_at: new Date(),
        custom_data: {
          ...formData.custom_data,
          birth_date: customerData.birth_date
        }
      };

      console.log("💾 Saving Opportunity Data to DB:", opportunityData);
      console.log("🔍 Verifying Fields for Trigger -> CPF:", opportunityData.customer_cpf_cnpj, "Phone:", opportunityData.customer_phone);

      let finalOppId = activityId;

      if (activityId) {
         const { error: updateError } = await supabase
            .from('sales_opportunities')
            .update(opportunityData)
            .eq('id', activityId);
         
         if (updateError) throw updateError;
      } else {
         const { data: newOpp, error: insertError } = await supabase
            .from('sales_opportunities')
            .insert({ ...opportunityData, created_at: new Date() })
            .select('id')
            .single();
         
         if (insertError) throw insertError;
         finalOppId = newOpp.id;
      }

      // 3. Products Saving (unchanged logic)
      if (formData.status === 'sale_made' && finalOppId) {
          await supabase.from('opportunity_products').delete().eq('opportunity_id', finalOppId);
          if (productsList.length > 0) {
              const productsPayload = productsList.map(p => ({
                  opportunity_id: finalOppId,
                  product_id: p.product_id,
                  quantity_sold: sanitizeNumber(p.quantity_sold),
                  unit_sale_price_at_sale: sanitizeNumber(p.unit_sale_price_at_sale),
                  unit_cost_price_at_sale: sanitizeNumber(p.unit_cost_price_at_sale),
                  created_at: new Date()
              }));
              const { error: prodError } = await supabase.from('opportunity_products').insert(productsPayload);
              if (prodError) throw new Error("Erro ao salvar produtos: " + prodError.message);
          }
      }

      // 4. Refill Logic
      let refillPromptData = null;
      if (formData.status === 'sale_made' && productsList.length > 0) {
           const productIds = productsList.map(p => p.product_id);
           const { data: pDetails } = await supabase.from('products').select('name').in('id', productIds);
           const pNames = pDetails ? pDetails.map(p => p.name) : [];
           
           if (pNames.some(n => REFILL_PRODUCTS.some(r => n.toLowerCase().includes(r)))) {
               refillPromptData = {
                   customerId,
                   customerName: customerData.name,
                   productNames: pNames,
                   saleDate: formData.visit_date
               };
           }
      }

      toast({ title: "Sucesso", description: "Atividade salva com sucesso.", className: "bg-emerald-500 border-none text-white" });
      if (!refillPromptData && onActivityAdded) onActivityAdded();
      
      console.log("✅ Save Activity Complete.");
      console.groupEnd();

      return { success: true, refillPromptData };

    } catch (error) {
      console.error("🔥 CRITICAL ERROR saving activity:", error);
      console.groupEnd();
      toast({ title: "Erro", description: error.message || "Falha ao salvar.", variant: "destructive" });
      throw error;
    }
  }, [user, onActivityAdded, activityId, REFILL_PRODUCTS]);

  const scheduleRefillActivity = useCallback(async (refillData, date) => {
      // Existing logic unchanged...
      try {
          let targetDate;
          if (date) {
             targetDate = new Date(date);
          } else if (refillData.saleDate) {
             targetDate = addMonths(parseISO(refillData.saleDate), 9);
          } else {
             targetDate = addMonths(new Date(), 9);
          }

          if (!isValid(targetDate)) targetDate = addMonths(new Date(), 9);
          
          const visitDateStr = targetDate.toISOString();

          const { error } = await supabase.from('sales_opportunities').insert({
              distributor_id: user.id, 
              customer_id: refillData.customerId, 
              customer_name: refillData.customerName,
              status: 'scheduled', 
              visit_date: visitDateStr, 
              visit_time: '09:00', 
              activity_type: 'troca_refil',
              consultant_name: user.name || 'Eu', 
              notes: 'Agendamento automático de troca de refil (9 meses após venda).',
              created_at: new Date(),
              updated_at: new Date()
          });

          if (error) throw error;
          
          toast({ title: "Agendado", description: "Troca de refil agendada para 9 meses.", className: "bg-emerald-500 text-white" });
          if (onActivityAdded) onActivityAdded();
      } catch (err) {
          console.error("❌ Error scheduling refill:", err);
          toast({ title: "Erro", description: "Erro ao agendar troca de refil.", variant: "destructive" });
      }
  }, [user, onActivityAdded]);

  return { saveActivity, scheduleRefillActivity };
};