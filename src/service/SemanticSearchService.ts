import { supabase } from '../api/supabaseClient';
import type { Product } from '../types/product.types';

export interface SemanticSearchResult {
  product:    Product;
  similarity: number; // 0-1, higher = more relevant
}

export class SemanticSearchService {

  /**
   * Determines if a query should use semantic search vs keyword search.
   *
   * Semantic search is better for:
   * - Long natural language queries (5+ words)
   * - Queries without obvious product keywords
   * - Questions ("something for...")
   *
   * Keyword search is better for:
   * - Short specific queries ("headphones", "Nike shoes")
   * - SKU/model numbers
   * - Brand names
   */
  static shouldUseSemanticSearch(query: string): boolean {
    const trimmed    = query.trim();
    const wordCount  = trimmed.split(/\s+/).length;
    const hasSpecificProductKeywords = /\b(sku|model|brand|nike|sony|apple)\b/i.test(trimmed);

    return wordCount >= 4 && !hasSpecificProductKeywords;
  }

  /**
   * Calls the semantic-search Edge Function.
   * Returns products ranked by semantic similarity.
   */
  static async search(
    query: string,
    options: { threshold?: number; limit?: number } = {}
  ): Promise<SemanticSearchResult[]> {
    const { data, error } = await supabase.functions.invoke('semantic-search', {
      body: {
        query,
        threshold: options.threshold ?? 0.3,
        limit:     options.limit     ?? 10,
      },
    });

    if (error) throw new Error(`SemanticSearchService.search: ${error.message}`);

    // Map to typed results with similarity scores
    return (data.products ?? []).map((p: any) => ({
      product:    p as Product,
      similarity: p.similarity as number,
    }));
  }

  /**
   * Hybrid search: tries semantic first, falls back to keyword.
   * This gives the best of both approaches.
   */
  static async hybridSearch(query: string): Promise<{
    results:  SemanticSearchResult[];
    method:   'semantic' | 'keyword';
    query:    string;
  }> {
    const useSemantic = SemanticSearchService.shouldUseSemanticSearch(query);

    if (useSemantic) {
      try {
        const results = await SemanticSearchService.search(query);

        // If semantic returns results, use them
        if (results.length > 0) {
          return { results, method: 'semantic', query };
        }

        // If semantic finds nothing, fall through to keyword
        console.log('[SemanticSearch] No results, falling back to keyword search');
      } catch (err) {
        // If Edge Function fails, fall through to keyword
        console.warn('[SemanticSearch] Failed, falling back to keyword:', err);
      }
    }

    // Keyword search via regular Supabase query
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      results: (data ?? []).map((p) => ({ product: p as Product, similarity: 1 })),
      method:  'keyword',
      query,
    };
  }
}