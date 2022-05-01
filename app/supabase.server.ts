import type { SupabaseClientOptions } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

//import { name as appName } from "../package.json";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error("SUPABASE_SERVICE_ROLE is required");
}

const supabaseOptions: SupabaseClientOptions = {
  schema: "public",
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  //headers: { "x-application-name": appName },
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  supabaseOptions
);
