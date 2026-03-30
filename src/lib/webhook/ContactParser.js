export const ContactParser = {
    /**
     * Validates and normalizes phone numbers to +55 format
     * @param {string} phone 
     * @returns {{ isValid: boolean, formatted: string, original: string }}
     */
    parsePhone: (phone) => {
      if (!phone) return { isValid: false, formatted: null, original: phone };
  
      // Remove non-numeric characters
      let cleaned = phone.replace(/\D/g, '');
  
      // Check for common patterns
      // Case: 5511999999999 (Full with country code)
      if (cleaned.length === 13 && cleaned.startsWith('55')) {
        // Valid
      }
      // Case: 11999999999 (Area code + number)
      else if (cleaned.length === 11) {
        cleaned = '55' + cleaned;
      }
      // Case: 999999999 (No area code - tough, maybe assume default or invalid)
      else {
        // Attempt to salvage if it's 10 digits (old landline or missing digit)
        if (cleaned.length === 12 && cleaned.startsWith('55')) {
             // Missing 9 digit?
        } else {
             return { isValid: false, formatted: null, original: phone };
        }
      }
  
      // Format
      const formatted = `+${cleaned}`;
  
      return { isValid: true, formatted, original: phone };
    },
  
    /**
     * Cleans and capitalizes names
     * @param {string} name 
     * @returns {string}
     */
    cleanName: (name) => {
      if (!name) return 'Desconhecido';
      
      // Remove emojis or special chars often found in social names
      // Allow letters, spaces, accents
      let cleaned = name.trim();
  
      // Detect spam/bot names (simplified)
      if (cleaned.match(/^\+?\d+$/)) return 'Sem Nome'; // It's just a number
  
      // Capitalize first letters
      return cleaned.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    },
  
    /**
     * Validates contact object and assigns confidence
     * @param {object} contact 
     * @returns {object} with validation metrics
     */
    validate: (contact) => {
      const errors = [];
      let score = 100;
  
      // Phone Check
      const phoneCheck = ContactParser.parsePhone(contact.phone);
      if (!phoneCheck.isValid) {
        errors.push('Telefone inválido');
        score -= 40;
      }
  
      // Name Check
      if (!contact.name || contact.name === 'Desconhecido' || contact.name === 'Sem Nome') {
        errors.push('Nome ausente ou inválido');
        score -= 30;
      } else if (contact.name.length < 3) {
         score -= 10;
      }
  
      return {
        isValid: errors.length === 0 || score > 40, // Allow partial validity
        errors,
        confidence_score: Math.max(0, score),
        normalized_phone: phoneCheck.formatted,
        normalized_name: ContactParser.cleanName(contact.name)
      };
    }
  };