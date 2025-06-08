import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if the URL is still a placeholder value
if (supabaseUrl.includes('your_supabase_project_url') || supabaseUrl === 'your_supabase_project_url') {
  throw new Error('Please replace VITE_SUPABASE_URL in your .env file with your actual Supabase project URL (e.g., https://your-project-id.supabase.co)');
}

// Check if the anon key is still a placeholder value
if (supabaseAnonKey.includes('your_supabase_anon_key') || supabaseAnonKey === 'your_supabase_anon_key') {
  throw new Error('Please replace VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase anon key');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: "${supabaseUrl}". Please ensure it's a valid URL (e.g., https://your-project-id.supabase.co) here is the error though ${error}`);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);