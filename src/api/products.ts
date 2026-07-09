import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import type { Product } from "../types/database.types";

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  status?: "draft" | "active" | "archived";
  color?: string;
  minPrice?: number;
  maxPrice?: number;
};

// export interface ProductFilters {
//   categoryId?: string | null;
//   searchQuery?: string;
//   sortBy?: 'newest' | 'price_asc' | 'price_desc';
//   vendorId?: string; // when set, scopes to a single vendor's products (vendor dashboard)
// }

const PRODUCTS_KEY = "products";

// async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
//   let query = supabase.from('products').select('*');

//   // Public catalog view only ever sees active products; vendor dashboard
//   // (when vendorId is passed) sees all of its own products regardless of status.
//   if (!filters.vendorId) {
//     query = query.eq('status', 'active');
//   } else {
//     query = query.eq('vendor_id', filters.vendorId);
//   }

//   if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
//   if (filters.searchQuery) query = query.ilike('title', `%${filters.searchQuery}%`);

//   if (filters.sortBy === 'price_asc') query = query.order('price', { ascending: true });
//   else if (filters.sortBy === 'price_desc') query = query.order('price', { ascending: false });
//   else query = query.order('created_at', { ascending: false });

//   const { data, error } = await query;
//   if (error) throw error;
//   return data as Product[];
// }

async function fetchProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Product;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    // Every distinct filter combination gets its own cache entry.
    // React Query will show cached results instantly when filters
    // repeat (e.g. user goes back to a previous filter state).
    queryKey: ["products", filters],
    queryFn: async () => {
      let query = supabase.from("products").select("*");

      // Default to only showing active products unless explicitly overridden
      // (e.g. vendor dashboard wants to see drafts too)
      query = query.eq("status", filters.status ?? "active");

      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      // Color lives inside the `metadata` jsonb column.
      // Postgres jsonb operator ->> extracts a text value to compare.
      if (filters.color) {
        query = query.eq("metadata->>color", filters.color);
      }

      // Search title OR description, case-insensitive
      if (filters.search?.trim()) {
        const term = filters.search.trim();
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      return data;
    },
    // Keep previous page's data visible while new filters load,
    // instead of flashing to a loading spinner every time.
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      const { data, error } = await supabase
        .from("products")
        .insert(newProduct)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Product>;
    }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}
