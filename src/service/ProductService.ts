import { supabase } from '../api/supabaseClient';
import type { Product, ProductFilters, CreateProductInput, UpdateProductInput } from '../types/product.types';

/**
 * ProductService
 *
 * Static class that owns ALL Supabase communication for products.
 * Zero React imports — this is pure TypeScript business logic.
 *
 * Senior dev pattern: services are framework-agnostic.
 * If we switched from React to Vue tomorrow, this file is unchanged.
 * Only the hooks (which are React-specific) would need replacing.
 *
 * Why a class with static methods vs plain functions?
 * - Groups related operations under one namespace
 * - Easy to mock in tests: jest.spyOn(ProductService, 'getAll')
 * - Consistent import: import { ProductService } from '../services/ProductService'
 */
export class ProductService {

  /**
   * Fetch products with optional filters.
   * Supabase query is built dynamically based on what filters are provided.
   * Only adds query clauses that are actually needed — keeps SQL clean.
   */
  static async getAll( filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase.from('products').select('*');

    // Default: public catalog sees only active products.
    // Vendor dashboard passes status explicitly to see drafts.
    query = query.eq('status', filters.status ?? 'active');
    
    // Vendor scoping — vendor sees only their own products
    if (filters.vendorId) {
      query = query.neq('vendor_id', filters.userId);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    // Search in metadata jsonb column using Postgres ->> operator
    if (filters.search?.trim()) {
      const term = filters.search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new Error(`ProductService.getAll: ${error.message}`);
    return data as Product[];
  }


  static async getVendorProducts( filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase.from('products').select('*');

    // Default: public catalog sees only active products.
    // Vendor dashboard passes status explicitly to see drafts.
    query = query.eq('status', filters.status ?? 'active');
   
    // Vendor scoping — vendor sees only their own products
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    // Search in metadata jsonb column using Postgres ->> operator
    if (filters.search?.trim()) {
      const term = filters.search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new Error(`ProductService.getAll: ${error.message}`);
    return data as Product[];
  }

  /**
   * Fetch a single product by ID.
   * Throws if not found — let the hook/component decide how to handle it.
   */
  static async getById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`ProductService.getById: ${error.message}`);
    return data as Product;
  }

  /**
   * Create a new product.
   * Returns the created product with its generated id/timestamps.
   */
  static async create(input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`ProductService.create: ${error.message}`);
    return data as Product;
  }

  
  /**
   * Update an existing product.
   * Partial update — only sends changed fields to Supabase.
   */
  static async update(id: string, updates: UpdateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`ProductService.update: ${error.message}`);
    return data as Product;
  }

  /**
   * Delete a product.
   * Hard delete — consider soft delete (status = 'archived') for production.
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`ProductService.delete: ${error.message}`);
  }

static async generateEmbedding(productId: string): Promise<void> {
  /**
   * Calls the Edge Function to generate and store the embedding.
   * Fire-and-forget — we don't block the UI waiting for OpenAI.
   * If it fails, the product still works, just won't appear in
   * semantic search until embedding is generated.
   */
  const { error } = await supabase.functions.invoke('generate-embedding', {
    body: { productId },
  });

  if (error) {
    // Log but don't throw — embedding failure shouldn't break product creation
    console.warn(`Embedding generation failed for ${productId}:`, error);
  }
}
}

