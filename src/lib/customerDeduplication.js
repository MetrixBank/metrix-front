import { supabase } from '@/lib/supabaseClient';

/**
 * Normalizes a phone number for comparison by removing all non-digit characters.
 * @param {string} phone - The phone number to normalize.
 * @returns {string} - The normalized phone string (digits only).
 */
export const formatPhoneForComparison = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Checks if a customer already exists based on name, phone, or email.
 * This is primarily for "New Customer" creation flow.
 * @param {object} params - Search parameters
 * @returns {Promise<{exists: boolean, customer: object|null, reason: string|null}>}
 */
export const checkCustomerExists = async ({ name, email, phone, distributorId, excludeId = null }) => {
  if (!distributorId) return { exists: false, customer: null, reason: null };

  // 1. Check by Name (Exact match, case insensitive)
  if (name && name.length > 2) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('distributor_id', distributorId)
      .ilike('name', name.trim());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: nameMatch, error: nameError } = await query.limit(1);

    if (!nameError && nameMatch && nameMatch.length > 0) {
      return { exists: true, customer: nameMatch[0], reason: 'name' };
    }
  }

  // 2. Check by Email
  if (email && email.length > 5 && email.includes('@')) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('distributor_id', distributorId)
      .eq('email', email.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: emailMatch, error: emailError } = await query.limit(1);

    if (!emailError && emailMatch && emailMatch.length > 0) {
      return { exists: true, customer: emailMatch[0], reason: 'email' };
    }
  }

  // 3. Check by Phone (Normalized)
  if (phone) {
    const cleanPhone = formatPhoneForComparison(phone);
    if (cleanPhone.length >= 8) { 
        // We can't easily do a strict normalized check in Supabase query without a generated column or function
        // So we search loosely and filter in JS, or rely on the DB trigger for strict enforcement.
        // Here we do a loose check to warn the user early.
        let query = supabase
          .from('customers')
          .select('*')
          .eq('distributor_id', distributorId)
          .ilike('phone', `%${cleanPhone.slice(-8)}%`); // Match last 8 digits to be safe

        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        let { data: phoneMatch, error: phoneError } = await query.limit(5);

         if (!phoneError && phoneMatch && phoneMatch.length > 0) {
            const strictMatch = phoneMatch.find(c => formatPhoneForComparison(c.phone).includes(cleanPhone) || cleanPhone.includes(formatPhoneForComparison(c.phone)));
            if (strictMatch) {
                return { exists: true, customer: strictMatch, reason: 'phone' };
            }
         }
    }
  }

  return { exists: false, customer: null, reason: null };
};

/**
 * Detects duplicate customers within a given list based on name, phone, or email.
 * @param {Array} customers - List of customers to check
 * @returns {Array} - Array of groups, where each group is an array of duplicate customers.
 */
export const detectDuplicateCustomers = (customers = []) => {
    if (!customers || customers.length < 2) return [];

    const groups = [];
    const processedIds = new Set();

    // Helper to normalize strings for loose comparison
    const norm = (str) => str ? str.toLowerCase().trim() : '';

    for (let i = 0; i < customers.length; i++) {
        const current = customers[i];
        if (processedIds.has(current.id)) continue;

        const duplicates = [current];
        const currentPhone = formatPhoneForComparison(current.phone);
        const currentName = norm(current.name);
        const currentEmail = norm(current.email);

        for (let j = i + 1; j < customers.length; j++) {
            const compare = customers[j];
            if (processedIds.has(compare.id)) continue;

            let isMatch = false;
            
            // Name match (exact)
            if (currentName && currentName === norm(compare.name)) isMatch = true;
            
            // Email match
            else if (currentEmail && compare.email && currentEmail === norm(compare.email)) isMatch = true;

            // Phone match (last 8 digits)
            else if (currentPhone && compare.phone) {
                const comparePhone = formatPhoneForComparison(compare.phone);
                // Check if one contains the other or they match on last 8 digits
                if (currentPhone.length >= 8 && comparePhone.length >= 8) {
                    if (currentPhone.includes(comparePhone) || comparePhone.includes(currentPhone) || currentPhone.slice(-8) === comparePhone.slice(-8)) {
                        isMatch = true;
                    }
                }
            }

            if (isMatch) {
                duplicates.push(compare);
                processedIds.add(compare.id);
            }
        }

        if (duplicates.length > 1) {
            // Sort by created_at (oldest first usually considered primary, or most complete)
            duplicates.sort((a, b) => {
                // Score based on completeness
                const aScore = (a.phone ? 1 : 0) + (a.email ? 1 : 0) + (a.cpf_cnpj ? 1 : 0) + (a.address ? 1 : 0);
                const bScore = (b.phone ? 1 : 0) + (b.email ? 1 : 0) + (b.cpf_cnpj ? 1 : 0) + (b.address ? 1 : 0);
                if (bScore !== aScore) return bScore - aScore; // Descending score
                
                // If scores equal, prefer older record
                if (a.created_at && b.created_at) {
                    return new Date(a.created_at) - new Date(b.created_at);
                }
                return 0;
            });
            groups.push(duplicates);
            processedIds.add(current.id);
        }
    }

    return groups;
};

/**
 * Merges duplicate customers into a primary customer record.
 * @param {string} primaryId - The ID of the customer to keep.
 * @param {Array<string>} duplicateIds - The IDs of customers to merge and delete.
 * @returns {Promise<{success: boolean, error: object|null}>}
 */
export const mergeCustomerData = async (primaryId, duplicateIds) => {
    if (!primaryId || !duplicateIds || duplicateIds.length === 0) return { success: false, error: 'Invalid params' };

    try {
        // 1. Update sales_opportunities
        const { error: oppError } = await supabase
            .from('sales_opportunities')
            .update({ customer_id: primaryId })
            .in('customer_id', duplicateIds);
        
        if (oppError) throw oppError;

        // 2. Update ai_assistant_tasks
        const { error: taskError } = await supabase
            .from('ai_assistant_tasks')
            .update({ customer_id: primaryId })
            .in('customer_id', duplicateIds);

        if (taskError) throw taskError;

        // 3. Update customer_intelligence - delete duplicates first (constraint usually one per customer)
        const { error: intelError } = await supabase
            .from('customer_intelligence')
            .delete()
            .in('customer_id', duplicateIds);
            
        if (intelError) console.warn("Error cleaning intelligence (non-fatal):", intelError);

        // 4. Delete the duplicate customers
        const { error: delError } = await supabase
            .from('customers')
            .delete()
            .in('id', duplicateIds);

        if (delError) throw delError;

        return { success: true, error: null };
    } catch (error) {
        console.error("Merge failed:", error);
        return { success: false, error };
    }
};