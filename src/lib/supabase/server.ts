import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with the service role key.
 * Server-only — will hard-error at build time if imported from client code.
 * Returns a fresh client per call to avoid cross-request contamination.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
