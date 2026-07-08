import { supabase } from '../api/supabaseClient';
import type { Order, OrderItem, PlaceOrderInput } from '../types/order.types';

export class OrderService {

  static async getByCustomer(customerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`OrderService.getByCustomer: ${error.message}`);
    return data as Order[];
  }

  static async getByVendor(vendorId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders(*)')
      .eq('vendor_id', vendorId)
      .order('order_id', { ascending: false });

    if (error) throw new Error(`OrderService.getByVendor: ${error.message}`);
    return data as OrderItem[];
  }

  static async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`OrderService.getAll: ${error.message}`);
    return data as Order[];
  }

  /**
   * Place a new order — atomic operation:
   * 1. Insert the order row
   * 2. Insert all order_item rows
   *
   * Senior dev note: Ideally this would be a Supabase Edge Function
   * (single DB transaction) so if step 2 fails, step 1 rolls back.
   * As a client-side operation, partial failure is possible.
   * Mark it as a known tech debt with a comment.
   *
   * TODO: Move to Edge Function for atomic transaction guarantee.
   */
  static async place(input: PlaceOrderInput): Promise<Order> {
    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: input.customerId,
        status: 'pending',
        total_amount: totalAmount,
        shipping_address: input.shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw new Error(`OrderService.place (order): ${orderError.message}`);

    const orderItems = input.items.map((item) => ({
      order_id: (order as Order).id,
      product_id: item.productId,
      vendor_id: item.vendorId,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw new Error(`OrderService.place (items): ${itemsError.message}`);

    return order as Order;
  }

  static async updateStatus(
    orderId: string,
    status: Order['status']
  ): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(`OrderService.updateStatus: ${error.message}`);
    return data as Order;
  }
}