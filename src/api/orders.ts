import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import type { Order, OrderItem } from '../types/database.types';
import type { CartItem } from '../store/cartSlice';

const ORDERS_KEY = 'orders';

// Customer: their own orders. RLS already restricts rows to customer_id = auth.uid(),
// but filtering explicitly here keeps the query intent obvious.
export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', customerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

// Vendor: order_items belonging to them, joined back to parent order info.
export function useVendorOrders(vendorId: string | undefined) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('vendor_id', vendorId!)
        .order('order_id', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

// Admin: all orders, no scoping (RLS allows this only for role = 'admin').
export function useAllOrders() {
  return useQuery({
    queryKey: [ORDERS_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

interface PlaceOrderInput {
  customerId: string;
  items: CartItem[];
  shippingAddress: Record<string, unknown>;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, items, shippingAddress }: PlaceOrderInput) => {
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: shippingAddress,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems: Partial<OrderItem>[] = items.map((item) => ({
        order_id: (order as Order).id,
        product_id: item.productId,
        vendor_id: item.vendorId,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
    },
  });
}
