export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: Record<string, unknown>;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: number;
}

export interface PlaceOrderInput {
  customerId: string;
  items: {
    productId: string;
    vendorId: string;
    price: number;
    quantity: number;
  }[];
  shippingAddress: Record<string, unknown>;
}
