import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OrderStatus, PlaceOrderInput } from '../types/order.types';
import { OrderService } from '../service/OrderService';

export const orderKeys = {
  all:      () => ['orders'] as const,
  customer: (id: string) => [...orderKeys.all(), 'customer', id] as const,
  vendor:   (id: string) => [...orderKeys.all(), 'vendor', id] as const,
  admin:    () => [...orderKeys.all(), 'all'] as const,
};

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.customer(customerId!),
    queryFn:  () => OrderService.getByCustomer(customerId!),
    enabled:  !!customerId,
  });
}

export function useVendorOrders(vendorId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.vendor(vendorId!),
    queryFn:  () => OrderService.getByVendor(vendorId!),
    enabled:  !!vendorId,
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: orderKeys.admin(),
    queryFn:  () => OrderService.getAll(),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => OrderService.place(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() });
    },
  });
}

// export function useUpdateOrderStatus() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ orderId, status }: {
//       orderId: string;
//       status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
//     }) => OrderService.updateStatus(orderId, status),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: orderKeys.all() });
//     },
//   });
// }

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status:  OrderStatus;
    }) => OrderService.updateStatus(orderId, status),

    /**
     * Optimistic update for order status.
     * Admin sees the status chip change INSTANTLY
     * instead of waiting for Supabase to respond.
     */
    onMutate: async ({ orderId, status }) => {

      await queryClient.cancelQueries({ queryKey: orderKeys.admin() });

      const previousOrders = queryClient.getQueryData(orderKeys.admin());

      queryClient.setQueryData<any[]>(orderKeys.admin(), (old = []) =>
        old.map((order) =>
          order.id === orderId
            ? { ...order, status } // update just the status field
            : order               // leave all other orders unchanged
        )
      );

      return { previousOrders };
    },

    onError: (_error, _variables, context) => {
   
      if (context?.previousOrders) {
        queryClient.setQueryData(orderKeys.admin(), context.previousOrders);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() });
    },
  });
}