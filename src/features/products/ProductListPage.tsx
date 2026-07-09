import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Box, Container, Grid, TextField, MenuItem,
  Typography, Stack, Button, Alert, CircularProgress,
  Chip, InputAdornment,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from "../../store/hooks";
import { useCategories } from '../../hooks/useCategories';
import { addItem } from '../../store/cartSlice';
import { setCartDrawerOpen } from '../../store/uiSlice';
import ProductCard from './ProductCard';
import { useAuth } from "../../hooks/useAuth";

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first'        },
  { value: 'price_asc',  label: 'Price: Low to High'  },
  { value: 'price_desc', label: 'Price: High to Low'  },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

export default function ProductListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useAuth();

  // ── Filter state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy]           = useState<SortOption>('newest');
  const [maxPrice, setMaxPrice]       = useState<number | undefined>();
  const [categoryId, setCategoryId]   = useState('');
  // '' means "all categories" — the default "show everything" state

  const debouncedSearch = useDebounce(searchInput, 400);
  const isTyping        = searchInput !== debouncedSearch;

  // ── Categories for dropdown ───────────────────────────────────
  const { data: categories } = useCategories();

  const categoryOptions = useMemo(() => [
    { value: '', label: 'All categories' },
    ...(categories?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ], [categories]);
  // useMemo here: categories array is stable between renders, so this
  // derived array won't be re-created on every keystroke in search box

  // The full Category object for the currently selected id (for URL sync)
  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  // ── Effect 1: Read category from URL on first load ────────────
  // Runs when categories load OR when the URL ?category= param changes.
  // Converts URL slug → internal category id.
  //
  // Senior dev note: we depend on searchParams.get('category') (a string)
  // NOT on searchParams itself (object reference changes every render).
  // This is the key fix that prevents the infinite loop.
  const categorySlugFromUrl = searchParams.get('category');

  useEffect(() => {
    if (!categories || !categorySlugFromUrl) {
      // No slug in URL → keep showing all products (categoryId = '')
      return;
    }

    const matched = categories.find((c) => c.slug === categorySlugFromUrl);

    // Only update state if it's actually different —
    // avoids triggering Effect 2 unnecessarily
    if (matched && matched.id !== categoryId) {
      setCategoryId(matched.id);
    }
  }, [categories, categorySlugFromUrl]);
  
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (selectedCategory) next.set('category', selectedCategory.slug);
      else next.delete('category');
      return next;
    }, { replace: true });
  }, [selectedCategory]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch) next.set('q', debouncedSearch);
      else next.delete('q');
      return next;
    }, { replace: true });
  }, [debouncedSearch]);

  // ── Server state ─────────────────────────────────────────────
  // Key insight: categoryId = '' → undefined → Supabase ignores the filter
  // categoryId = 'some-uuid' → filters by that category
  const { data: products, isLoading, isError, isFetching } = useProducts({
    userId: userId || '',
    search: debouncedSearch   || undefined,
    sortBy,
    maxPrice,
    categoryId: categoryId || undefined,
  });

  console.log('ProductListPage render', products, userId);

  // ── useMemo: derived stats from products ──────────────────────
  const stats = useMemo(() => {
    if (!products?.length) return null;

    const prices   = products.map((p) => p.price);
    const inStock  = products.filter((p) => p.stock > 0).length;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;


    return {
      count: products.length,
      inStock,
      avgPrice,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [products]);

  // ── useCallback: stable handlers for React.memo children ─────
  const handleViewDetail = useCallback((id: string) => {
    navigate(`/products/${id}`);
  }, [navigate]);

  const handleAddToCart = useCallback((id: string) => {
    const product = products?.find((p) => p.id === id);
    if (!product) return;

    dispatch(addItem({
      productId: product.id,
      title:     product.title,
      price:     product.price,
      image:     product.images?.[0] ?? null,
      vendorId:  product.vendor_id,
      maxStock:  product.stock,
    }));
    dispatch(setCartDrawerOpen(true));
  }, [products, dispatch]);

  // ── Clear all filters ────────────────────────────────────────
  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setCategoryId('');
    setMaxPrice(undefined);
    setSortBy('newest');
  }, []);

  const hasActiveFilters = !!(searchInput || categoryId || maxPrice);

  // Dev tracking
  // if (import.meta.env.DEV) renderTracker.track('ProductListPage');

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Shop
        {/* Show active category as subtitle */}
        {/* {selectedCategory && (
          <Typography
            component="span"
            variant="h6"
            color="text.secondary"
            fontWeight={400}
            sx={{ ml: 1.5 }}
          >
            / {selectedCategory.name}
          </Typography>
        )} */}
      </Typography>

      {/* ── Filters row ──────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          placeholder="Search products…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (isTyping || isFetching) ? (
              <InputAdornment position="end">
                <CircularProgress size={14} />
              </InputAdornment>
            ) : null,
          }}
        />

        <TextField
          select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {categoryOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          sx={{ minWidth: 180 }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="Max price (₹)"
          type="number"
          value={maxPrice ?? ''}
          onChange={(e) =>
            setMaxPrice(e.target.value ? Number(e.target.value) : undefined)
          }
          sx={{ minWidth: 160 }}
          inputProps={{ min: 0 }}
        />

        {hasActiveFilters && (
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </Stack>

      {/* ── Active filter chips ───────────────────────────────── */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          {selectedCategory && (
            <Chip
              label={`Category: ${selectedCategory.name}`}
              onDelete={() => setCategoryId('')}
              color="primary"
              size="small"
            />
          )}
          {debouncedSearch && (
            <Chip
              label={`Search: "${debouncedSearch}"`}
              onDelete={() => setSearchInput('')}
              size="small"
            />
          )}
          {maxPrice && (
            <Chip
              label={`Max: ₹${maxPrice.toLocaleString('en-IN')}`}
              onDelete={() => setMaxPrice(undefined)}
              size="small"
            />
          )}
        </Stack>
      )}

      {/* ── Stats bar ─────────────────────────────────────────── */}
      {stats && (
        <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
          <Chip label={`${stats.count} products`} size="small" />
          <Chip
            label={`${stats.inStock} in stock`}
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Avg ₹${Math.round(stats.avgPrice).toLocaleString('en-IN')}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`₹${stats.minPrice.toLocaleString('en-IN')} – ₹${stats.maxPrice.toLocaleString('en-IN')}`}
            size="small"
            variant="outlined"
          />
        </Stack>
      )}

      {/* ── Loading / error / empty states ───────────────────── */}
      {isLoading && (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load products. Please try again.
        </Alert>
      )}

      {!isLoading && !isError && products?.length === 0 && (
        <Box textAlign="center" mt={8}>
          <Typography variant="h6" color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {selectedCategory
              ? `No products in "${selectedCategory.name}" yet`
              : debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : 'No products match your filters'}
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={handleClearFilters}
            >
              Clear all filters
            </Button>
          )}
        </Box>
      )}

      {/* ── Product grid ──────────────────────────────────────── */}
      <Grid
        container
        spacing={3}
        sx={{
          opacity: isFetching && !isLoading ? 0.65 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard
              id={product.id}
              title={product.title}
              price={product.price}
              image={product.images?.[0] ?? `https://picsum.photos/seed/${product.id}/400/300`}
              stock={product.stock}
              brand={(product.metadata as any)?.brand}
              onViewDetail={handleViewDetail}
              onAddToCart={handleAddToCart}
            />
          </Grid>
        ))}
      </Grid>

      {/* DEV: render tracker panel ──────────────────────────── */}
      {/* {import.meta.env.DEV && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16, left: 16,
            bgcolor: 'rgba(0,0,0,0.85)',
            color: 'white',
            p: 2, borderRadius: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            zIndex: 9999,
            minWidth: 220,
          }}
        >
          <Box fontWeight={700} mb={1}>🔍 Render tracker</Box>
          <Box>ProductListPage: {renderTracker.track('ProductListPage')}</Box>
          <Box>ProductCard total: {renderTracker.track('ProductCard')}</Box>
          <Box sx={{ mt: 1, opacity: 0.6, fontSize: 11 }}>
            Type in search → watch counts
          </Box>
        </Box>
      )} */}
    </Container>
  );
}