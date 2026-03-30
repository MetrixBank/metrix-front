import { supabase } from '@/lib/supabaseClient';

/**
 * Syncs customer data from sales_opportunities to customers table.
 * This is useful for backfilling data or ensuring consistency.
 * 
 * @param {string} distributorId - The ID of the distributor to sync data for.
 * @returns {Promise<{success: boolean, processed: number, updated: number, created: number}>}
 */
export const syncCustomerDataFromActivities = async (distributorId) => {
    if (!distributorId) return { success: false, error: 'Distributor ID required' };

    try {
        // 1. Fetch all sales opportunities for this distributor
        const { data: opportunities, error: oppError } = await supabase
            .from('sales_opportunities')
            .select('*')
            .eq('distributor_id', distributorId)
            .order('created_at', { ascending: true }); // Process oldest to newest to build up data

        if (oppError) throw oppError;
        if (!opportunities || opportunities.length === 0) return { success: true, processed: 0, updated: 0, created: 0 };

        let processed = 0;
        let updated = 0;
        let created = 0;

        // 2. Process each opportunity
        for (const opp of opportunities) {
            processed++;
            
            // Skip if minimal info
            if (!opp.customer_name || opp.customer_name.length < 2) continue;

            // Try to find existing customer
            let customerId = opp.customer_id;
            
            if (!customerId) {
                // Try to find by name or phone
                let query = supabase
                    .from('customers')
                    .select('id')
                    .eq('distributor_id', distributorId)
                    .ilike('name', opp.customer_name.trim());
                
                const { data: nameMatch } = await query.limit(1);
                
                if (nameMatch && nameMatch.length > 0) {
                    customerId = nameMatch[0].id;
                } else if (opp.customer_phone) {
                    // Try phone match
                    const cleanPhone = opp.customer_phone.replace(/\D/g, '');
                    if (cleanPhone.length >= 8) {
                         // Loose search then strict filter
                         const { data: phoneMatch } = await supabase
                            .from('customers')
                            .select('id, phone')
                            .eq('distributor_id', distributorId)
                            .ilike('phone', `%${cleanPhone.slice(-8)}%`)
                            .limit(5);
                         
                         if (phoneMatch) {
                             const match = phoneMatch.find(c => c.phone && c.phone.replace(/\D/g, '').includes(cleanPhone));
                             if (match) customerId = match.id;
                         }
                    }
                }
            }

            // Prepare data payload from opportunity
            const customerData = {
                distributor_id: distributorId,
                name: opp.customer_name,
                phone: opp.customer_phone,
                email: opp.customer_email,
                cpf_cnpj: opp.customer_cpf_cnpj,
                address: opp.customer_address,
                address_number: opp.customer_address_number,
                address_complement: opp.customer_address_complement,
                address_neighborhood: opp.customer_address_neighborhood,
                address_city: opp.customer_address_city,
                address_state: opp.customer_address_state,
                zip_code: opp.customer_cep,
                last_activity_date: opp.visit_date,
                updated_at: new Date().toISOString()
            };

            // Remove null/undefined/empty fields
            Object.keys(customerData).forEach(key => {
                if (customerData[key] === null || customerData[key] === undefined || customerData[key] === '') {
                    delete customerData[key];
                }
            });

            if (customerId) {
                // Update existing customer
                // Only update fields that are present in opportunity and might be missing/outdated in customer
                // We use a simple update here, relying on Postgres to handle no-op updates efficiently
                // However, to avoid overwriting good data with bad, we might want to be careful.
                // For now, we assume opportunity data is "latest truth" if it exists.
                
                try {
                    const { error: updateError } = await supabase
                        .from('customers')
                        .update(customerData)
                        .eq('id', customerId);
                    
                    if (!updateError) {
                        updated++;
                        // Link opportunity if not linked
                        if (!opp.customer_id) {
                            await supabase.from('sales_opportunities').update({ customer_id: customerId }).eq('id', opp.id);
                        }
                    }
                } catch (e) {
                    // Ignore unique constraint errors during sync
                    console.warn("Sync update skipped due to conflict", e);
                }

            } else {
                // Create new customer
                try {
                    const { data: newCustomer, error: createError } = await supabase
                        .from('customers')
                        .insert(customerData)
                        .select('id')
                        .single();
                    
                    if (!createError && newCustomer) {
                        created++;
                        // Link opportunity
                        await supabase.from('sales_opportunities').update({ customer_id: newCustomer.id }).eq('id', opp.id);
                    }
                } catch (e) {
                     // Ignore unique constraint errors during sync (likely race condition or duplicate data)
                     console.warn("Sync creation skipped due to conflict", e);
                }
            }
        }

        return { success: true, processed, updated, created };

    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, error };
    }
};