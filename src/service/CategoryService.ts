import { supabase } from '../api/supabaseClient';
import type { Category } from '../types/database.types';

export class CategoryService {
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw new Error(`CategoryService.getAll: ${error.message}`);
    return data as Category[];
  }
}