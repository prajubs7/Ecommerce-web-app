import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PlaceOrderInput } from '../types/order.types';
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

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: {
      orderId: string;
      status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
    }) => OrderService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() });
    },
  });
}