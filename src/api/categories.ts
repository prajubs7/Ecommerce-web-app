import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import type { Category } from '../types/database.types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000, // categories rarely change — cache longer
  });
}

