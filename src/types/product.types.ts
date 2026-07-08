export type ProductStatus = 'draft' | 'active' | 'archived';

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

export interface ProductFilters {
  search?: string;
  categoryId?: string | null;
  vendorId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}

export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductInput = Partial<CreateProductInput>;