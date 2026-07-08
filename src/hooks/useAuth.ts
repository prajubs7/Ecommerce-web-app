import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../store/hooks';
import { AuthService } from '../service/AuthService';

/**
 * useAuth — clean selector hook for auth state.
 *
 * Senior dev pattern: never let components import from store directly.
 * All Redux access goes through custom hooks. This means:
 * - Components don't know Redux exists (easier to swap state library)
 * - One place to add auth-related derived state
 * - Cleaner component code
 */


export const profileKeys = {
  all:    () => ['profiles'] as const,
  lists:  () => [...profileKeys.all(), 'list'] as const,
  detail: (id: string) => [...profileKeys.all(), 'detail', id] as const,
};

// ── Session hook (reads from Redux — no network call) ──────────
export function useAuth() {
  const { userId, email, profile, isInitializing } = useAppSelector(
    (state) => state.auth
  );

  return {
    userId,
    email,
    profile,
    isInitializing,
    isLoggedIn:       !!userId,
    isCustomer:       profile?.role === 'customer',
    isVendor:         profile?.role === 'vendor',
    isAdmin:          profile?.role === 'admin',
    isApprovedVendor: profile?.role === 'vendor' && profile?.vendor_status === 'approved',
  };
}

// ── All profiles (admin only) ──────────────────────────────────
export function useAllProfiles() {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn:  () => AuthService.getAllProfiles(),
    // No staleTime — admin needs fresh data
  });
}

// ── Approve / reject vendor ────────────────────────────────────
export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      AuthService.updateVendorStatus(id, status),
    onSuccess: () => {
      // Invalidate all profile queries so the table refreshes
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
    },
  });
}