import { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../api/products';

export default function ProductListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: products, isLoading, isError, error } = useProducts({ searchQuery: search });

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>Shop</Typography>

      <TextField
        fullWidth
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4, maxWidth: 480 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          Couldn't load products: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {!isLoading && !isError && products?.length === 0 && (
        <Typography color="text.secondary">No products match your search.</Typography>
      )}

      <Grid container spacing={3}>
        {products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/products/${product.id}`)}>
                <CardMedia
                  component="img"
                  height="180"
                  image={product.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                  alt={product.title}
                />
                <CardContent>
                  <Typography variant="subtitle1" noWrap>{product.title}</Typography>
                  <Typography variant="h6" color="secondary.dark">
                    ${product.price.toFixed(2)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
