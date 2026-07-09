import { supabase } from '../api/supabaseClient';

const BUCKET = 'product-images';

export class StorageService {

  /**
   * Upload a product image.
   * Path: vendorId/uuid.ext — scoped per vendor for easy RLS later.
   */
  static async uploadProductImage(file: File, vendorId: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const path = `${vendorId}/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw new Error(`StorageService.upload: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a product image by its public URL.
   * Extracts the storage path from the URL — keeps callers clean.
   */
  static async deleteProductImage(publicUrl: string): Promise<void> {
    const marker = `${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const path = publicUrl.slice(idx + marker.length);
    const { error } = await supabase.storage.from(BUCKET).remove([path]);

    if (error) throw new Error(`StorageService.delete: ${error.message}`);
  }
}