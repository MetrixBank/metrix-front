// Utility functions for Webhook and API Key management

/**
 * Generates a secure random API key string.
 * Format: sk_live_[32 random hex characters]
 */
export const generateAPIKey = () => {
  const prefix = 'sk_live_';
  const array = new Uint8Array(24); // 24 bytes = 48 hex chars
  crypto.getRandomValues(array);
  const randomPart = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${randomPart}`;
};

/**
 * Hashes an API key using SHA-256 for secure storage.
 * @param {string} key - The raw API key
 * @returns {Promise<string>} - The hex string of the hash
 */
export const hashAPIKey = async (key) => {
  const msgBuffer = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Validates if a string is a valid URL.
 * @param {string} url - The URL to validate
 * @returns {Object} - { isValid: boolean, error: string | null }
 */
export const validateWebhookURL = (url) => {
  if (!url) {
    return { isValid: false, error: 'A URL é obrigatória.' };
  }
  
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'A URL deve começar com http:// ou https://' };
    }
    return { isValid: true, error: null };
  } catch (e) {
    return { isValid: false, error: 'Formato de URL inválido.' };
  }
};

/**
 * Validates the payload structure of an incoming webhook.
 * @param {Object} payload - The JSON payload received
 * @returns {Object} - Validation report
 */
export const validateWebhookPayload = (payload) => {
    const report = {
        hasPhone: false,
        hasName: false,
        hasMessage: false,
        hasDistributor: false,
        errors: [],
        extracted: {}
    };

    // 1. Check Path: data.contact.number
    if (payload?.data?.contact?.number) {
        report.hasPhone = true;
        report.extracted.phone = payload.data.contact.number;
    } else {
        report.errors.push("Missing data.contact.number");
    }

    // 2. Check Path: data.contact.name
    if (payload?.data?.contact?.name) {
        report.hasName = true;
        report.extracted.name = payload.data.contact.name;
    } else {
        report.errors.push("Missing data.contact.name");
    }

    // 3. Check Path: data.message
    if (payload?.data?.message) {
        report.hasMessage = true;
        report.extracted.message = payload.data.message;
    } else {
        report.errors.push("Missing data.message");
    }

    // 4. Check Path: data.distributor_id
    if (payload?.data?.distributor_id) {
        report.hasDistributor = true;
        report.extracted.distributorId = payload.data.distributor_id;
    } else {
         report.errors.push("Missing data.distributor_id");
    }

    const passed = report.hasPhone && report.hasName && report.hasMessage;
    
    console.group("Webhook Validation Test");
    console.log("Status:", passed ? "PASSED ✅" : "FAILED ❌");
    console.log("Details:", report);
    console.groupEnd();

    return report;
};