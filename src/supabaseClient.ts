import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase environment variables are missing");
  console.error("URL:", supabaseUrl);
  console.error("KEY exists:", !!supabaseAnonKey);
}

export const supabase = createClient(
  supabaseUrl as string,
  supabaseAnonKey as string
);
