import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Creates a presigned upload URL for the responses storage bucket.
 * Returns the upload URL and the storage path for later reference.
 */
export async function createSignedUploadUrl(storagePath: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from("responses")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  };
}
