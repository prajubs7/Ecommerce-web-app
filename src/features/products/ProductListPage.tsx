import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  TextField,
  MenuItem,
  Slider,
  Typography,
  Stack,
  Button,
  CardActionArea,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from "../../store/hooks";
import { useCategories } from "../../hooks/useCategories";
import type { ProductFilters } from "../../types/product.types";

const COLORS = ["black", "white", "silver", "red", "blue"]; // could come from DB later

export default function ProductListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Raw input state — instant UI feedback
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [color, setColor] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  // Only the search text needs debouncing — dropdowns/sliders
  // don't fire on every pixel, they fire on commit (onChangeCommitted)
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch) next.set('q', debouncedSearch);
      else next.delete('q');
      return next;
    }, { replace: true });
  }, [debouncedSearch, searchParams]);

  // Build ONE filters object — this is the key pattern.
  // useMemo prevents creating a new object reference every render,
  // which matters because `filters` is the React Query cache key.
  // Without this, a new {} reference each render would look like a
  // "new" query key to React Query even when values are identical.
 const filters: ProductFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
      color: color || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    }),
    [debouncedSearch, categoryId, color, priceRange, status]
  );

  const { data: products, isLoading, isFetching } = useProducts(filters);
  const { data: categories } = useCategories();

  const clearFilters = () => {
    setSearchInput("");
    setCategoryId("");
    setColor("");
    setPriceRange([0, 5000]);
  };

  const activeFilterCount = [categoryId, color, debouncedSearch].filter(
    Boolean,
  ).length;

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>

      <Grid container spacing={3}>
        {/* Filter sidebar */}
        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            <TextField
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">Any Color</MenuItem>
              {COLORS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="body2" gutterBottom>
                Price: ₹{priceRange[0]} – ₹{priceRange[1]}
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, val) => setPriceRange(val as [number, number])}
                min={0}
                max={5000}
                step={100}
                // onChangeCommitted vs onChange matters here:
                // onChange fires on every pixel of drag (would spam queries),
                // but React Query only re-runs when `filters` changes, which
                // only happens when priceRange state updates. Using local
                // state for the slider + committing on change is fine since
                // the object memoizes — but for expensive queries you'd want
                // to debounce this too, same pattern as search.
              />
            </Box>

            {activeFilterCount > 0 && (
              <Button size="small" onClick={clearFilters}>
                Clear filters ({activeFilterCount})
              </Button>
            )}
          </Stack>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={9}>
          {isFetching && (
            <Typography variant="caption" color="text.secondary">
              Updating…
            </Typography>
          )}

          {!isLoading && products?.length === 0 && (
            <Typography color="text.secondary">
              No products match your filters.
            </Typography>
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
        </Grid>
      </Grid>
    </Container>
  );
}

// import { useState } from 'react';
// import {
//   Container,
//   Grid,
//   Card,
//   CardMedia,
//   CardContent,
//   CardActionArea,
//   Typography,
//   TextField,
//   InputAdornment,
//   CircularProgress,
//   Alert,
//   Box,
// } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
// import { useNavigate } from 'react-router-dom';
// import { useProducts } from '../../api/products';

// export default function ProductListPage() {
//   const navigate = useNavigate();
//   const [search, setSearch] = useState('');
//   const { data: products, isLoading, isError, error } = useProducts({ searchQuery: search });

//   return (
//     <Container sx={{ mt: 4, mb: 8 }}>
//       <Typography variant="h4" gutterBottom>Shop</Typography>

//       <TextField
//         fullWidth
//         placeholder="Search products…"
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         sx={{ mb: 4, maxWidth: 480 }}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               <SearchIcon />
//             </InputAdornment>
//           ),
//         }}
//       />

//       {isLoading && (
//         <Box display="flex" justifyContent="center" mt={6}>
//           <CircularProgress />
//         </Box>
//       )}

//       {isError && (
//         <Alert severity="error">
//           Couldn't load products: {error instanceof Error ? error.message : 'Unknown error'}
//         </Alert>
//       )}

//       {!isLoading && !isError && products?.length === 0 && (
//         <Typography color="text.secondary">No products match your search.</Typography>
//       )}

//       <Grid container spacing={3}>
//         {products?.map((product) => (
//           <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
//             <Card>
//               <CardActionArea onClick={() => navigate(`/products/${product.id}`)}>
//                 <CardMedia
//                   component="img"
//                   height="180"
//                   image={product.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
//                   alt={product.title}
//                 />
//                 <CardContent>
//                   <Typography variant="subtitle1" noWrap>{product.title}</Typography>
//                   <Typography variant="h6" color="secondary.dark">
//                     ${product.price.toFixed(2)}
//                   </Typography>
//                 </CardContent>
//               </CardActionArea>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// }
