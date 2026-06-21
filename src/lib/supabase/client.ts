/**
 * Browser-side Supabase client (anon key). Safe for client components.
 * Returns null when Supabase isn't configured so callers can degrade to
 * "unknown" rather than throwing.
 */
import { createBrowserClient } from "@supabase/ssr";
import { config, sources } from "@/lib/config";

export function browserSupabase() {
  if (!sources.supabase.available) return null;
  return createBrowserClient(config.supabase.url, config.supabase.anonKey);
}
