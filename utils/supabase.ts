import { createClient } from '@supabase/supabase-js';

// Using placeholder credentials for local development.
// For production, these should be replaced with environment variables.
const supabaseUrl = 'https://xyz.supabase.co';
const supabaseAnonKey = 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase configuration is missing. Please provide SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
