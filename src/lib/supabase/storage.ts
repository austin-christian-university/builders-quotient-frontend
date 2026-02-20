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

/**
 * Creates a signed download URL for reading files from a storage bucket.
 * Returns null if the URL cannot be created (missing file, permissions, etc.).
 */
export async function createSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;

  return data.signedUrl;
}
