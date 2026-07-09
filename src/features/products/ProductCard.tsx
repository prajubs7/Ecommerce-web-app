import { memo, useCallback, useMemo, useRef } from 'react';
import {
  Card, CardActionArea, CardMedia, CardContent,
  CardActions, Typography, Button, Chip, Box, Rating,
} from '@mui/material';
import { renderTracker } from '../../utils/renderTracker';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  stock: number;
  brand?: string;
  color?: string;
  categoryId?: string;
  rating?: number;
  reviewCount?: number;
  discountPercent?: number;
  // Callbacks passed from parent — must be stable references
  // (wrapped in useCallback in parent) for React.memo to work
  onViewDetail: (id: string) => void;
  onAddToCart: (id: string) => void;
}

/**
 * ProductCard — wrapped in React.memo
 *
 * React.memo does a SHALLOW comparison of props.
 * If all props are the same reference/value as last render,
 * this component is skipped entirely.
 *
 * This ONLY works if:
 * 1. Primitive props (string, number, boolean) — always stable ✅
 * 2. Function props — MUST be wrapped in useCallback in parent ✅
 * 3. Object/array props — MUST be wrapped in useMemo in parent ✅
 *
 * If parent passes onAddToCart={() => ...} inline (new function each render),
 * React.memo is completely bypassed and this optimization does nothing.
 */
const ProductCard = memo(function ProductCard({
  id,
  title,
  price,
  image,
  stock,
  brand,
  color,
  categoryId,
  rating = 4.5,
  reviewCount = 0,
  discountPercent = 0,
  onViewDetail,
  onAddToCart,
}: ProductCardProps) {

  // ── Render counter (dev only) ──────────────────────────────
  const renderCount = useRef(0);
  renderCount.current += 1;
  renderTracker.track('ProductCard');

  // ── useMemo: derived values ────────────────────────────────
  /**
   * discountedPrice:
   * Recalculates ONLY when price or discountPercent changes.
   * Without useMemo: recalculates on EVERY render even if price unchanged.
   *
   * For simple math like this, useMemo overhead isn't worth it alone —
   * the value here is educational. In production, use it when:
   * - Calculation is expensive (sorting 1000 items, complex filtering)
   * - Result is passed to a memoized child as a prop
   */
  const discountedPrice = useMemo(() => {
    if (discountPercent <= 0) return price;
    return price - (price * discountPercent) / 100;
  }, [price, discountPercent]);

  /**
   * stockStatus: derived object — without useMemo, this creates a
   * NEW object reference every render, which would break any child
   * component that receives it as a prop (React.memo can't see same object)
   */
  const stockStatus = useMemo(() => {
    if (stock === 0)  return { label: 'Out of stock', color: 'error'   as const };
    if (stock <= 5)   return { label: `Only ${stock} left`, color: 'warning' as const };
    return              { label: 'In stock',    color: 'success' as const };
  }, [stock]);

  console.log(`ProductCard ${id} render: discountedPrice=${discountedPrice}, stockStatus=${stockStatus.label} , color=${color}`);
  // ── useCallback: stable event handlers ────────────────────
  /**
   * These handlers are wrapped in useCallback so their reference
   * stays stable across re-renders of THIS component.
   *
   * Wait — why wrap them here if we already wrapped them in the parent?
   * Because these close over `id` — each card has a different id.
   * The parent provides stable `onViewDetail` and `onAddToCart` functions
   * that accept an id. We bind the specific id here.
   *
   * Without useCallback here:
   * Even if parent's callbacks are stable, these arrow functions
   * (if passed to a child like a Button via React.memo) would be
   * new on every ProductCard render.
   */
  const handleViewDetail = useCallback(() => {
    onViewDetail(id);
  }, [onViewDetail, id]); // stable if onViewDetail is stable and id doesn't change

  const handleAddToCart = useCallback(() => {
    onAddToCart(id);
  }, [onAddToCart, id]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* DEV ONLY: render counter badge */}
      {/* {import.meta.env.DEV && (
        <Box
          sx={{
            position: 'absolute',
            top: 8, right: 8, zIndex: 10,
            bgcolor: renderCount.current === 1 ? 'success.main' : 'error.main',
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            px: 1, py: 0.25,
            borderRadius: 1,
          }}
        >
          renders: {renderCount.current}
        </Box>
      )} */}

      <CardActionArea onClick={handleViewDetail} sx={{ flexGrow: 1 }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height={200}
            image={image}
            alt={title}
            sx={{ objectFit: 'cover' }}
          />
          {discountPercent > 0 && (
            <Chip
              label={`-${discountPercent}%`}
              color="error"
              size="small"
              sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 700 }}
            />
          )}
        </Box>

        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          {brand && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase' }}
            >
              {brand} 
            </Typography>
          )}
          {color && (
            <Typography
              variant="caption" 
              sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'capitalize', ml: 1 }}
            >
              {color}
            </Typography>
          )}
          </Box>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              mt: 0.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 44,
            }}
          >
            {title}
          </Typography>

          {reviewCount > 0 && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <Rating value={rating} precision={0.5} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                ({reviewCount})
              </Typography>
            </Box>
          )}

          <Box display="flex" alignItems="baseline" gap={1} mt={1}>
            <Typography variant="h6" fontWeight={800} color="secondary.dark">
              ₹{discountedPrice.toLocaleString('en-IN')}
            </Typography>
            {discountPercent > 0 && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textDecoration: 'line-through' }}
              >
                ₹{price.toLocaleString('en-IN')}
              </Typography>
            )}
          </Box>

          <Chip
            label={stockStatus.label}
            color={stockStatus.color}
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          disabled={stock === 0}
          onClick={handleAddToCart}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
});

export default ProductCard;