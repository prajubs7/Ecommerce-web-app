import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useProduct } from '../../hooks/useProducts';
import { useAppDispatch } from '../../store/hooks';
import { addItem } from '../../store/cartSlice';
import { setCartDrawerOpen } from '../../store/uiSlice';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { data: product, isLoading, isError, error } = useProduct(id);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !product) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {isError && error instanceof Error ? error.message : 'Product not found.'}
        </Alert>
      </Container>
    );
  }

  const handleAddToCart = () => {
    dispatch(
      addItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] ?? null,
        vendorId: product.vendor_id,
        maxStock: product.stock,
      })
    );
    dispatch(setCartDrawerOpen(true));
  };

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={5}>
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={product.images?.[0] ?? 'https://placehold.co/600x500?text=No+Image'}
            alt={product.title}
            sx={{ width: '100%', borderRadius: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>{product.title}</Typography>
          <Typography variant="h5" color="secondary.dark" gutterBottom>
            ${product.price.toFixed(2)}
          </Typography>
          {product.stock <= 0 ? (
            <Chip label="Out of stock" color="error" sx={{ mb: 2 }} />
          ) : (
            <Chip label={`${product.stock} in stock`} color="success" variant="outlined" sx={{ mb: 2 }} />
          )}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {product.description}
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
          >
            Add to cart
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
