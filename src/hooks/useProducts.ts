import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ProductFilters, CreateProductInput, UpdateProductInput } from '../types/product.types';
import { ProductService } from '../service/ProductService';

/**
 * Query key factory — centralizes all product cache keys.
 *
 * Senior dev pattern: never scatter magic strings like ['products', id]
 * throughout the codebase. One place to change, one place to invalidate.
 *
 * Usage:
 *   productKeys.all         → ['products']
 *   productKeys.list(filters) → ['products', 'list', { filters }]
 *   productKeys.detail(id)  → ['products', 'detail', id]
 */
export const productKeys = {
  all:    () => ['products'] as const,
  lists:  () => [...productKeys.all(), 'list'] as const,
  list:   (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all(), 'detail', id] as const,
};

export function useProducts( filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn:  () => ProductService.getAll( filters),
    // Show previous results while new filters load —
    // prevents loading flicker on every filter change
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000, // 30s — products don't change every second
  });
}

export function useVendorProducts( filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => ProductService.getVendorProducts( filters),
    // Show previous results while new filters load —
    // prevents loading flicker on every filter change
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000, // 30s — products don't change every second
  });
}


export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn:  () => ProductService.getById(id!),
    enabled:  !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => ProductService.create(input),
    onSuccess: async (createdProduct) => {
      // Invalidate cache first so product appears immediately
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      // Then generate embedding in the background
      // Don't await — don't block the UI
      ProductService.generateEmbedding(createdProduct.id).catch((err) => {
        console.warn('Background embedding failed:', err);
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProductInput }) =>
      ProductService.update(id, updates),
    onSuccess: (updatedProduct) => {
      // Update cache immediately
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      // Regenerate embedding if title or description changed
      // (content changed = embedding is stale)
      ProductService.generateEmbedding(updatedProduct.id).catch((err) => {
        console.warn('Background embedding regeneration failed:', err);
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProductService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}