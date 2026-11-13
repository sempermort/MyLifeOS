import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const configured = !SUPABASE_URL.includes("YOUR-PROJECT") &&
                   !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
export const isConfigured = configured;
export const supabase = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
