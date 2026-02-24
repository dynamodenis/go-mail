import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://nedebyhskxcgqigyweav.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZGVieWhza3hjZ3FpZ3l3ZWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDQ1MTUsImV4cCI6MjA3NjIyMDUxNX0.6v7lrlROcSFubfU9tAaEhsYE2M5dDF1CUaEdgS7HX6c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
