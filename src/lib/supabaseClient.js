import * as CustomClient from '@/lib/customSupabaseClient';

// Robustly resolve the client instance handling various export patterns
// This prevents module resolution errors if the underlying client file structure changes
const client = CustomClient.supabase || CustomClient.customSupabaseClient || CustomClient.default;

if (!client) {
  console.error('CRITICAL: Supabase client failed to initialize. Verify src/lib/customSupabaseClient.js exports.');
}

// Export as both named and default to satisfy all consumers
export const supabase = client;
export default client;