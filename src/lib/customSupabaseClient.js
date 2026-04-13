import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
/** Chave anon clássica ou publishable (Supabase novo); qualquer uma serve no `createClient`. */
const supabaseKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/** Evita `throw` no carregamento do módulo (tela branca no dev sem .env). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const customSupabaseClient = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseKey)
	: null;

export default customSupabaseClient;

export {
	customSupabaseClient,
	customSupabaseClient as supabase,
};
