import { supabase } from '../api/supabaseClient';

export interface WishlistItem {
  id:         string;
  user_id:    string;
  product_id: string;
  created_at: string;
}

export class WishlistService {

  static async getByUser(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`WishlistService.getByUser: ${error.message}`);
    return data as WishlistItem[];
  }

  static async add(userId: string, productId: string): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) throw new Error(`WishlistService.add: ${error.message}`);
    return data as WishlistItem;
  }

  static async remove(userId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw new Error(`WishlistService.remove: ${error.message}`);
  }
}