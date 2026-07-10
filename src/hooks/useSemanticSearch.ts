import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { SemanticSearchService, type SemanticSearchResult } from '../service/SemanticSearchService';


interface UseSemanticSearchReturn {
  results:    SemanticSearchResult[];
  isLoading:  boolean;
  isError:    boolean;
  error:      string | null;
  method:     'semantic' | 'keyword' | null;
  isSemantic: boolean;
  query:      string;
}

/**
 * useSemanticSearch
 *
 * Combines debouncing + hybrid search (semantic → keyword fallback).
 * Automatically decides which search method to use based on query length.
 */
export function useSemanticSearch(rawQuery: string): UseSemanticSearchReturn {
  const debouncedQuery = useDebounce(rawQuery, 500); // slightly longer for AI calls

  const [results,   setResults]   = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError,   setIsError]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [method,    setMethod]    = useState<'semantic' | 'keyword' | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setMethod(null);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const { results, method } = await SemanticSearchService.hybridSearch(query);
      setResults(results);
      setMethod(method);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return {
    results,
    isLoading,
    isError,
    error,
    method,
    isSemantic: method === 'semantic',
    query:      debouncedQuery,
  };
}