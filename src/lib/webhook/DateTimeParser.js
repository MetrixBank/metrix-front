import { parse, format, isValid, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DateTimeParser = {
  /**
   * Parses various date formats into standard DD/MM/YYYY HH:MM
   * @param {string|number} input - The date string or timestamp
   * @returns {string|null} - Formatted date string or null if invalid
   */
  normalize: (input) => {
    if (!input) return null;

    let dateObj;

    // Handle Unix Timestamp (seconds or milliseconds)
    if (typeof input === 'number') {
      dateObj = new Date(input > 1e10 ? input : input * 1000);
    } 
    // Handle ISO string
    else if (typeof input === 'string' && input.includes('T')) {
      dateObj = parseISO(input);
    }
    // Handle Brazilian format (simple check)
    else if (typeof input === 'string' && input.includes('/')) {
        // Try parsing DD/MM/YYYY HH:MM:SS
        let parsed = parse(input, 'dd/MM/yyyy HH:mm:ss', new Date());
        if (!isValid(parsed)) parsed = parse(input, 'dd/MM/yyyy HH:mm', new Date());
        if (!isValid(parsed)) parsed = parse(input, 'dd/MM/yyyy', new Date());
        dateObj = parsed;
    }
    // Handle generic new Date parsing
    else {
      dateObj = new Date(input);
    }

    if (!isValid(dateObj)) return null;

    return format(dateObj, 'dd/MM/yyyy HH:mm');
  },

  /**
   * Returns a relative time string (e.g., "há 5 minutos")
   * @param {string|Date} input 
   * @returns {string}
   */
  toRelative: (input) => {
    if (!input) return '';
    
    // If input is string format from normalize
    let dateObj;
    if (typeof input === 'string' && input.includes('/')) {
         dateObj = parse(input, 'dd/MM/yyyy HH:mm', new Date());
    } else {
         dateObj = new Date(input);
    }

    if (!isValid(dateObj)) return '';

    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  },

  /**
   * Extracts separate date and time parts
   * @param {string|Date} input 
   * @returns {{ date: string, time: string }}
   */
  extractParts: (input) => {
    const normalized = DateTimeParser.normalize(input);
    if (!normalized) return { date: null, time: null };

    const [date, time] = normalized.split(' ');
    return { date, time }; // Returns DD/MM/YYYY and HH:MM
  }
};