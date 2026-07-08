import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '../service/CategoryService';


export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn:  () => CategoryService.getAll(),
    staleTime: 5 * 60 * 1000, // categories change rarely — cache 5 min
    gcTime:    10 * 60 * 1000, // keep in memory 10 min after last use
  });
}