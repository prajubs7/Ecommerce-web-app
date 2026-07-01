import { supabase } from './supabaseClient';

const BUCKET = 'product-images';

/**
 * Uploads a single image file to the product-images bucket under the
 * vendor's own folder (vendorId/uuid-filename) and returns its public URL.
 * Folder-per-vendor keeps storage tidy and makes it trivial to add a
 * per-vendor storage RLS policy later if the bucket stops being fully public.
 */
export async function uploadProductImage(file: File, vendorId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const path = `${vendorId}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(publicUrl: string): Promise<void> {
  // Public URL looks like: .../storage/v1/object/public/product-images/<path>
  const marker = `${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
