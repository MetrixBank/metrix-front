/**
 * ConexZap Local Simulation Utility
 * 
 * This file allows testing the webhook logic logic client-side 
 * before deploying the Edge Function.
 * 
 * NOTE: This is a simulation. It uses the currently authenticated user's 
 * credentials (via supabase client) rather than the Service Role used 
 * by the real Edge Function. Therefore, it respects RLS policies.
 */

import { supabase } from '@/lib/supabaseClient';

// Helper to match Edge Function logic
const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (phone.includes('@')) {
     cleaned = phone.split('@')[0].replace(/\D/g, '');
  }
  return cleaned;
};

const extractConexzapContact = (payload) => {
  if (payload?.body?.contact && payload?.body?.method === "contact-create-update") {
    const contact = payload.body.contact;
    const rawPhone = contact.number || '';
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) return null;

    return {
      name: (contact.name || contact.pushname || 'Unknown').trim(),
      phone: phone,
      email: contact.email || undefined,
      conexzap_contact_id: contact.id ? String(contact.id) : undefined,
      timestamp: payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString(),
      raw_data: payload,
      is_legacy: false
    };
  }
  return null;
};

const normalizeLegacyData = (payload) => {
  // Simplified legacy normalizer for local sim
  const name = payload.nome || payload.name || '';
  const phone = normalizePhone(payload.telefone || payload.phone || '');
  const message = payload.mensagem || payload.message || '';
  
  return {
    name: String(name).trim(),
    phone: phone,
    message: String(message).trim(),
    timestamp: new Date().toISOString(),
    is_legacy: true
  };
};

export const simulateConexzapWebhook = async (payload, apiKey) => {
  console.group('🔍 ConexZap Local Simulation');
  console.log('Payload:', payload);

  const startTime = Date.now();

  try {
    // 1. Validate Inputs
    if (!apiKey) {
      throw new Error('Missing API Key');
    }

    // 2. Normalize Data
    let normalized = extractConexzapContact(payload);
    
    if (!normalized) {
      normalized = normalizeLegacyData(payload);
      // Validate Legacy
      if (!normalized.name || !normalized.phone || normalized.phone.length < 10) {
         throw new Error('Invalid Data: Missing name or phone (or phone < 10 digits)');
      }
    }

    // 3. Check for Existing Lead
    const { data: existingLeads, error: searchError } = await supabase
      .from('leads')
      .select('id, internal_notes, custom_data')
      .eq('phone', normalized.phone)
      .limit(1);

    if (searchError) throw searchError;

    let result;
    const timestamp = new Date().toLocaleString();
    
    // Determine note content based on type
    let noteContent = null;
    if (normalized.raw_data?.mensagem || (normalized.is_legacy && normalized.message)) {
      noteContent = `[${timestamp}] [SIMULATION] Webhook Message: ${normalized.message || normalized.raw_data.mensagem}`;
    } else if (!existingLeads?.length && !normalized.is_legacy) {
      noteContent = `[${timestamp}] [SIMULATION] Contact Synced via ConexZap`;
    }

    // 4. Update or Insert
    if (existingLeads && existingLeads.length > 0) {
      console.log('Found existing lead:', existingLeads[0].id);
      const lead = existingLeads[0];
      
      const updates = {
        last_activity_at: new Date().toISOString(),
        name: normalized.name // Sync name
      };

      if (normalized.email) updates.email = normalized.email;
      
      if (normalized.conexzap_contact_id) {
         const currentCustom = lead.custom_data || {};
         updates.custom_data = { ...currentCustom, conexzap_contact_id: normalized.conexzap_contact_id };
      }

      if (noteContent) {
        updates.internal_notes = lead.internal_notes 
          ? `${lead.internal_notes}\n\n${noteContent}`
          : noteContent;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', lead.id)
        .select()
        .single();
        
      if (error) throw error;
      result = { ...data, action: 'updated' };
    } else {
      console.log('Creating new lead...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to simulate this locally.');

      const customData = normalized.conexzap_contact_id ? { conexzap_contact_id: normalized.conexzap_contact_id } : {};

      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          distributor_id: user.id,
          name: normalized.name,
          phone: normalized.phone,
          email: normalized.email,
          status: 'new',
          source: normalized.is_legacy ? 'conexzap_legacy_sim' : 'conexzap_sync_sim',
          channel: 'whatsapp',
          internal_notes: noteContent || 'Simulated Lead',
          custom_data: customData,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'created' };
    }

    console.log('Simulation Success:', result);
    console.groupEnd();

    return {
      success: true,
      data: result,
      duration: Date.now() - startTime
    };

  } catch (error) {
    console.error('Simulation Failed:', error);
    console.groupEnd();
    return {
      success: false,
      error: error.message
    };
  }
};