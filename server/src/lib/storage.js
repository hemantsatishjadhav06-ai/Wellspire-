// Small file-storage helper built on the Supabase Storage API. Degrades
// gracefully when Supabase isn't configured — callers get { configured:false }
// instead of an exception, so the rest of the app keeps running in demo mode.
import supabase from './supabaseClient.js';
import config from '../config.js';
import logger from './logger.js';

export const configured = Boolean(supabase);

// Create the bucket if it doesn't exist yet. Ignores "already exists" errors
// so it's safe to call repeatedly before every upload.
export async function ensureBucket(bucket) {
  if (!configured) return;
  try {
    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error && !/already exists/i.test(error.message || '')) {
      logger.warn(`storage.ensureBucket(${bucket}) failed`, error.message || error);
    }
  } catch (err) {
    logger.warn(`storage.ensureBucket(${bucket}) threw`, err.message || err);
  }
}

// Upload a buffer and return its public URL. No-ops (configured:false) when
// Supabase isn't wired up.
export async function uploadFile(bucket, path, buffer, contentType) {
  if (!configured) return { configured: false };
  try {
    await ensureBucket(bucket);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true });
    if (error) {
      logger.warn(`storage.uploadFile(${bucket}/${path}) failed`, error.message || error);
      return { configured: true, path, publicUrl: null, error: error.message || String(error) };
    }
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { configured: true, path, publicUrl };
  } catch (err) {
    logger.warn(`storage.uploadFile(${bucket}/${path}) threw`, err.message || err);
    return { configured: true, path, publicUrl: null, error: err.message || String(err) };
  }
}

// Resolve the public URL for an existing object, or null when unavailable.
export async function getPublicUrl(bucket, path) {
  if (!configured) return null;
  try {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl || null;
  } catch (err) {
    logger.warn(`storage.getPublicUrl(${bucket}/${path}) threw`, err.message || err);
    return null;
  }
}

export default { configured, ensureBucket, uploadFile, getPublicUrl };
