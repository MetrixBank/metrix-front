import { DataExtractor } from './DataExtractor';
import { supabase } from '@/lib/supabaseClient';

export const WebhookProcessor = {
  /**
   * Receives raw webhook data, processes it, and persists to DB
   * @param {object} rawData 
   * @param {string} distributorId 
   */
  handle: async (rawData, distributorId) => {
    try {
        // 1. Extract & Analyze
        const result = DataExtractor.process(rawData);
        
        // 2. Prepare Log Entry
        const logEntry = {
            distributor_id: distributorId,
            raw_data: rawData,
            extracted_data: result,
            confidence_score: result.meta.confidence_score,
            status: 'success',
            error_message: null
        };

        // 3. Database Operations (if distributor provided)
        if (distributorId) {
            // A. Insert Log
            const { data: logData, error: logError } = await supabase
                .from('webhook_logs')
                .insert([logEntry])
                .select()
                .single();
            
            if (logError) throw new Error('Failed to create log: ' + logError.message);

            // B. Upsert Contact
            // Only if we have a valid phone
            if (result.contact.phone) {
                 // Check if contact exists
                 const { data: existingContact } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('phone', result.contact.phone)
                    .eq('distributor_id', distributorId)
                    .single();
                 
                 let contactId;
                 
                 if (existingContact) {
                     contactId = existingContact.id;
                     await supabase.from('contacts').update({
                         name: result.contact.name, // Maybe only update if placeholder? keeping simple
                         last_message: result.message.content,
                         last_message_date: result.message.date ? new Date(result.message.date.split('/').reverse().join('-')) : new Date(), // Convert DD/MM/YYYY to YYYY-MM-DD
                         last_message_time: result.message.time,
                         extracted_at: new Date(),
                         confidence_score: result.meta.confidence_score,
                         extraction_metadata: result
                     }).eq('id', contactId);
                 } else {
                     const { data: newContact, error: createError } = await supabase.from('contacts').insert([{
                         distributor_id: distributorId,
                         name: result.contact.name,
                         phone: result.contact.phone,
                         last_message: result.message.content,
                         last_message_date: result.message.date ? new Date(result.message.date.split('/').reverse().join('-')) : new Date(),
                         last_message_time: result.message.time,
                         extracted_at: new Date(),
                         confidence_score: result.meta.confidence_score,
                         extraction_metadata: result
                     }]).select().single();
                     
                     if (createError) throw createError;
                     contactId = newContact.id;
                 }

                 // C. Insert Message History
                 if (result.message.content) {
                     await supabase.from('message_history').insert([{
                         contact_id: contactId,
                         message_content: result.message.content,
                         message_date: result.message.date ? new Date(result.message.date.split('/').reverse().join('-')) : new Date(),
                         message_time: result.message.time,
                         direction: 'in', // Assume incoming from webhook
                         extracted_from_webhook: true
                     }]);
                 }
            }
        }

        return { success: true, data: result };

    } catch (error) {
        console.error('Webhook Processing Error:', error);
        
        // Log failure if possible
        if (distributorId) {
             await supabase.from('webhook_logs').insert([{
                distributor_id: distributorId,
                raw_data: rawData,
                extracted_data: null,
                status: 'error',
                error_message: error.message,
                confidence_score: 0
             }]);
        }
        
        return { success: false, error: error.message };
    }
  }
};