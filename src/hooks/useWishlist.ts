import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from './useAuth';
import { WishlistService, type WishlistItem } from '../service/WishlistService';

// ── Query key factory ──────────────────────────────────────────
export const wishlistKeys = {
  all:     ()         => ['wishlists'] as const,
  user:    (id: string) => [...wishlistKeys.all(), 'user', id] as const,
};

// ── Fetch wishlist ─────────────────────────────────────────────
export function useWishlist() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: wishlistKeys.user(userId!),
    queryFn:  () => WishlistService.getByUser(userId!),
    enabled:  !!userId,
    staleTime: 60 * 1000,
  });
}

// ── Derived: check if specific product is wishlisted ──────────
export function useIsWishlisted(productId: string): boolean {
  const { data: wishlist } = useWishlist();
  return wishlist?.some((item) => item.product_id === productId) ?? false;
}

// ── Toggle wishlist WITH optimistic update ────────────────────
export function useToggleWishlist() {
  const queryClient  = useQueryClient();
  const { userId }   = useAuth();
  const queryKey     = wishlistKeys.user(userId!);

  return useMutation({
    /**
     * mutationFn: the actual API call.
     * Receives { productId, isCurrentlyWishlisted }
     * Calls add or remove based on current state.
     */
    mutationFn: async ({
      productId,
      isCurrentlyWishlisted,
    }: {
      productId:             string;
      isCurrentlyWishlisted: boolean;
    }) => {
      if (isCurrentlyWishlisted) {
        await WishlistService.remove(userId!, productId);
        return null; // removed
      } else {
        return WishlistService.add(userId!, productId); // added
      }
    },

    /**
     * onMutate: runs BEFORE the API call.
     * This is where optimistic update happens.
     *
     * Pattern:
     * 1. Cancel any in-flight queries (avoid race conditions)
     * 2. Snapshot current cache (for rollback)
     * 3. Optimistically update the cache
     * 4. Return snapshot in context (used by onError for rollback)
     */
    onMutate: async ({ productId, isCurrentlyWishlisted }) => {
      // Step 1: Cancel in-flight queries for this key
      // Prevents a slow refetch from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Step 2: Snapshot the current cached value
      // This is our "undo" data if the API call fails
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(queryKey);

      // Step 3: Optimistically update the cache RIGHT NOW
      // UI updates instantly without waiting for API
      queryClient.setQueryData<WishlistItem[]>(queryKey, (old = []) => {
        if (isCurrentlyWishlisted) {
          // Optimistically REMOVE
          return old.filter((item) => item.product_id !== productId);
        } else {
          // Optimistically ADD (with fake id/timestamp, server will provide real ones)
          const optimisticItem: WishlistItem = {
            id:         `optimistic-${productId}`,
            user_id:    userId!,
            product_id: productId,
            created_at: new Date().toISOString(),
          };
          return [optimisticItem, ...old];
        }
      });

      // Step 4: Return snapshot so onError can rollback
      // React Query passes this as `context` to onError
      return { previousWishlist };
    },

    /**
     * onError: runs if API call fails.
     * Rollback to the snapshot we saved in onMutate.
     *
     * context = what we returned from onMutate
     */
    onError: (error, _variables, context) => {
      if (context?.previousWishlist !== undefined) {
        // Restore the cache to its pre-mutation state
        queryClient.setQueryData(queryKey, context.previousWishlist);
      }
      console.error('Wishlist toggle failed, rolled back:', error);
    },

    /**
     * onSettled: runs after success OR failure.
     * Refetch from server to ensure cache is in sync with reality.
     *
     * Why refetch even on success?
     * Our optimistic item has a fake id ('optimistic-xxx').
     * We need the real server-generated id.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}