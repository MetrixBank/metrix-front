/**
 * Maps external webhook payload fields to internal application fields
 * based on the provided mapping configuration.
 * 
 * @param {Object} payload - The raw JSON payload from the webhook
 * @param {Array} mappings - Array of mapping objects { external_field_name, internal_field_name, data_type }
 * @returns {Object} Structured object with internal field names
 */
export const mapWebhookPayload = (payload, mappings = []) => {
    if (!payload) return {};

    const mappedData = {};
    const flattenedPayload = flattenObject(payload);

    // Default heuristics if no mappings provided (or fallback)
    if (!mappings || mappings.length === 0) {
        return {
            customer_name: findField(flattenedPayload, ['name', 'full_name', 'contact_name', 'pushName', 'senderName']),
            customer_phone: findField(flattenedPayload, ['phone', 'tel', 'whatsapp', 'mobile', 'remoteJid', 'wa_id']),
            customer_email: findField(flattenedPayload, ['email', 'mail']),
            message_content: findField(flattenedPayload, ['message', 'body', 'text', 'content', 'caption']),
            timestamp: findField(flattenedPayload, ['timestamp', 'date', 'time', 'created_at']) || new Date().toISOString(),
            raw_data: payload
        };
    }

    // Apply specific mappings
    mappings.forEach(map => {
        const value = flattenedPayload[map.external_field_name] || payload[map.external_field_name];
        
        if (value !== undefined) {
            let processedValue = value;
            
            // Basic type casting
            if (map.data_type === 'number') processedValue = Number(value);
            if (map.data_type === 'boolean') processedValue = Boolean(value);
            if (map.data_type === 'date') processedValue = new Date(value);

            mappedData[map.internal_field_name] = processedValue;
        }
    });

    // Ensure raw data is preserved
    mappedData.raw_data = payload;
    
    return mappedData;
};

// Helper: Flatten nested JSON objects to dot notation for easier mapping (e.g., "data.user.name")
function flattenObject(obj, prefix = '', res = {}) {
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flattenObject(value, newKey, res);
        } else {
            res[newKey] = value;
        }
    }
    return res;
}

// Helper: Case-insensitive search for keys
function findField(obj, candidates) {
    const keys = Object.keys(obj);
    for (const candidate of candidates) {
        const match = keys.find(k => k.toLowerCase().includes(candidate.toLowerCase()) || k === candidate);
        if (match) return obj[match];
    }
    return null;
}