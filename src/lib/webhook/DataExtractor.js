// Task 1: Refined extraction logic to handle specific Make.com payload structure
export const DataExtractor = {
  /**
   * Helper to safely get nested values
   */
  get: (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  },

  extractPhone: (data) => {
    // 1. Priority: Make.com structure (data.contact.number)
    const makePhone = DataExtractor.get(data, 'data.contact.number');
    if (makePhone) return makePhone;

    // 2. Standard WABA
    const wabaPhone = DataExtractor.get(data, 'entry.0.changes.0.value.messages.0.from') ||
                     DataExtractor.get(data, 'entry.0.changes.0.value.contacts.0.wa_id');
    if (wabaPhone) return wabaPhone;

    // 3. Direct/Legacy fallbacks
    const candidates = [
        data?.sender?.phone,
        data?.phone,
        data?.contact?.phone,
        data?.from,
        data?.wa_id
    ];

    const rawPhone = candidates.find(c => c);
    
    if (rawPhone && typeof rawPhone === 'string') {
        // Remove JID suffix if present
        return rawPhone.split('@')[0];
    }
    
    return rawPhone;
  },

  extractName: (data) => {
    // 1. Priority: Make.com structure (data.contact.name)
    const makeName = DataExtractor.get(data, 'data.contact.name');
    if (makeName) return makeName;

    // 2. Standard WABA
    const wabaName = DataExtractor.get(data, 'entry.0.changes.0.value.contacts.0.profile.name');
    if (wabaName) return wabaName;

    // 3. Direct/Legacy fallbacks
    const candidates = [
        data?.sender?.name,
        data?.contact?.name,
        data?.profile?.name,
        data?.pushName,
        data?.name
    ];

    return candidates.find(c => c) || null; // Return null if missing to trigger validation error
  },

  extractMessageContent: (data) => {
     // 1. Priority: Make.com structure (data.message)
     const makeMessage = DataExtractor.get(data, 'data.message');
     if (makeMessage) return makeMessage;

     // 2. Standard WABA
     const wabaMessage = DataExtractor.get(data, 'entry.0.changes.0.value.messages.0.text.body');
     if (wabaMessage) return wabaMessage;

     // 3. Direct/Legacy fallbacks
     const candidates = [
         data?.message?.text?.body,
         data?.body,
         data?.text,
         data?.content,
         data?.message
     ];

     const content = candidates.find(c => c);
     if (typeof content === 'object') {
        return content.text || content.body || JSON.stringify(content);
     }
     
     return content;
  },
  
  extractTimestamp: (data) => {
     // 1. Priority: Make.com structure (data.timestamp)
     const makeTime = DataExtractor.get(data, 'data.timestamp');
     if (makeTime) {
         const date = new Date(makeTime);
         if (!isNaN(date.getTime())) return date;
     }

     // 2. Fallbacks
     const wabaTime = DataExtractor.get(data, 'entry.0.changes.0.value.messages.0.timestamp');
     const candidates = [
         wabaTime,
         data?.timestamp,
         data?.date,
         data?.created_at
     ];

     const raw = candidates.find(c => c);
     
     if (!raw) return new Date();

     const num = Number(raw);
     if (!isNaN(num)) {
         if (num < 10000000000) return new Date(num * 1000); 
         return new Date(num);
     }
     
     return new Date(raw);
  },
  
  extractDistributorId: (data) => {
      return DataExtractor.get(data, 'data.distributor_id') || 
             DataExtractor.get(data, 'distributor_id') || 
             DataExtractor.get(data, 'user_id');
  }
};