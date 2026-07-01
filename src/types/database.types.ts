// Placeholder hand-written types matching the schema we designed.
// Once your Supabase project exists, replace this file by running:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type UserRole = 'customer' | 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'rejected';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  vendor_status: VendorStatus | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  status: ProductStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

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

// Minimal Database shape so `createClient<Database>` type-checks.
// Expand with Row/Insert/Update variants once you generate real types.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
    };
  };
}
