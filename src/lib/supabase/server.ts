/**
 * Server-side Supabase client. Uses the anon key for reads; the service-role
 * key is only used by trusted refresh jobs (never sent to the browser).
 * Returns null when unconfigured so route handlers degrade gracefully.
 */
import { createClient } from "@supabase/supabase-js";
import { config, sources } from "@/lib/config";

export function serverSupabase() {
  if (!sources.supabase.available) return null;
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false },
  });
}

/** Elevated client for write/refresh jobs. Server-only. */
export function adminSupabase() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
