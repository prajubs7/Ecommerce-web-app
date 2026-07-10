import { useNavigate }         from 'react-router-dom';
import {
  Container, Typography, Grid, Box,
  Button, CircularProgress, Alert,
} from '@mui/material';
import { useWishlist } from '../../hooks/useWishlist';
import { useProducts } from '../../hooks/useProducts';
import ProductCard  from '../products/ProductCard';
import { useAppDispatch } from '../../store/hooks';
import { addItem } from '../../store/cartSlice';
import { setCartDrawerOpen } from '../../store/uiSlice';
import { useCallback } from 'react';

export default function WishlistPage() {
  const navigate          = useNavigate();
  const dispatch          = useAppDispatch();
  const { data: wishlist, isLoading, isError } = useWishlist();

  
  const { data: allProducts } = useProducts({});

  const wishlistedProducts = allProducts?.filter((p) =>
    wishlist?.some((w) => w.product_id === p.id)
  ) ?? [];

  const handleViewDetail = useCallback(
    (id: string) => navigate(`/products/${id}`),
    [navigate]
  );

  const handleAddToCart = useCallback(
    (id: string) => {
      const product = wishlistedProducts.find((p) => p.id === id);
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
    },
    [wishlistedProducts, dispatch]
  );

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        My Wishlist
      </Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">Failed to load wishlist.</Alert>
      )}

      {!isLoading && wishlistedProducts.length === 0 && (
        <Box textAlign="center" mt={8}>
          <Typography variant="h6" color="text.secondary">
            Your wishlist is empty
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/products')}
          >
            Browse Products
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {wishlistedProducts.map((product) => (
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
    </Container>
  );
}