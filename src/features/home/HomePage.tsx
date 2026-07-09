import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
  InputBase,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';

import { useState } from 'react';
import { useProducts } from '../../api/products';
import { useAppDispatch } from '../../store/hooks';
import { addItem } from '../../store/cartSlice';
import { setCartDrawerOpen } from '../../store/uiSlice';

// ── Category data ───────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Electronics', slug: 'electronics', emoji: '🎧', color: '#E8F4FD' },
  { label: 'Clothing',    slug: 'clothing',    emoji: '👕', color: '#FDF0E8' },
  { label: 'Home & Kitchen', slug: 'home-kitchen', emoji: '🏠', color: '#E8FDF0' },
  { label: 'Fitness',     slug: 'fitness',     emoji: '💪', color: '#F0E8FD' },
  { label: 'Footwear',    slug: 'footwear',    emoji: '👟', color: '#FDE8E8' },
  { label: 'Books',       slug: 'books',       emoji: '📚', color: '#FDFDE8' },
];

// ── Trust badges ────────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: <LocalShippingOutlinedIcon sx={{ fontSize: 32 }} />, title: 'Free Delivery',   sub: 'On orders above ₹999' },
  { icon: <VerifiedOutlinedIcon      sx={{ fontSize: 32 }} />, title: '100% Authentic',  sub: 'Verified vendors only' },
  { icon: <SupportAgentOutlinedIcon  sx={{ fontSize: 32 }} />, title: '24/7 Support',    sub: 'We are always here' },
  { icon: <VerifiedOutlinedIcon      sx={{ fontSize: 32 }} />, title: 'Easy Returns',    sub: 'Hassle-free returns' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');

  const { data: featuredProducts } = useProducts({});

  const handleSearch = (e: React.FormEvent) => {
    console.log('Search submitted:', search);
    e.preventDefault();
    navigate(`/products?q=${search}`);
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] ?? null,
      vendorId: product.vendor_id,
      maxStock: product.stock,
    }));
    dispatch(setCartDrawerOpen(true));
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F4C5C 0%, #1a6b80 50%, #0d3d4a 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(232,146,74,0.15)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="🔥 New arrivals every week"
                sx={{ bgcolor: 'rgba(232,146,74,0.2)', color: '#E8924A', mb: 2, fontWeight: 600 }}
              />
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.2, mb: 2 }}
              >
                Shop Smart,
                <Box component="span" sx={{ color: '#E8924A' }}> Live Better</Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{ opacity: 0.85, fontWeight: 400, mb: 4, maxWidth: 480 }}
              >
                Discover thousands of products from verified vendors.
                Best prices, fast delivery, easy returns.
              </Typography>

              {/* Search bar */}
              <Paper
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 3,
                  px: 2,
                  py: 0.5,
                  maxWidth: 480,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <InputBase
                  placeholder="Search products, brands, categories…"
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ fontSize: '0.95rem' }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ borderRadius: 2, px: 3, ml: 1, whiteSpace: 'nowrap' }}
                >
                  Search
                </Button>
              </Paper>

              <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
                {['Headphones', 'Running Shoes', 'Coffee Grinder'].map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => navigate(`/products?q=${tag}`)}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.12)',
                      color: 'white',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                    }}
                  />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 420,
                  height: 320,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8rem',
                  backdropFilter: 'blur(10px)',
                }}
              >
                🛍️
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── TRUST BADGES ─────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container>
            {TRUST_BADGES.map((badge, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 3,
                    px: 2,
                    borderRight: i < 3 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ color: 'primary.main' }}>{badge.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{badge.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{badge.sub}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>Shop by Category</Typography>
          <Button
            onClick={() => navigate('/products')}
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            View all →
          </Button>
        </Box>
        <Grid container spacing={2}>
          {CATEGORIES.map((cat) => (
            <Grid item xs={6} sm={4} md={2} key={cat.slug}>
              <Box
                onClick={() => navigate(`/products?category=${cat.slug}`)}
                sx={{
                  bgcolor: cat.color,
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <Typography fontSize="2.5rem">{cat.emoji}</Typography>
                <Typography variant="body2" fontWeight={600} mt={1}>
                  {cat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Featured Products</Typography>
            <Typography variant="body2" color="text.secondary">
              Handpicked deals just for you
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/products')}
            sx={{ borderRadius: 2 }}
          >
            View all products
          </Button>
        </Box>

        <Grid container spacing={3}>
          {featuredProducts?.slice(0, 8).map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(`/products/${product.id}`)}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images?.[0] ?? 'https://placehold.co/400x300?text=No+Image'}
                    alt={product.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize="0.75rem"
                      textTransform="uppercase"
                      fontWeight={600}
                      mb={0.5}
                      
                    >
                      {(product.metadata as any)?.brand ?? 'Marketplace'}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.3,
                        mb: 1,
                        minHeight: '2.7em', 
                      }}
                    >
                      {product.title}
                    </Typography>
                    <Typography variant="h6" color="secondary.dark" fontWeight={700}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                <Box sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    sx={{ borderRadius: 2 }}
                    disabled={product.stock === 0}
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── BANNER CTA ───────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #E8924A 0%, #c97530 100%)',
          py: 8,
          mt: 6,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Sell on our Marketplace
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
            Join thousands of vendors and reach millions of customers.
            Easy setup, powerful dashboard, fast payouts.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                bgcolor: 'white',
                color: '#E8924A',
                fontWeight: 700,
                borderRadius: 3,
                px: 4,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Start Selling
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                borderRadius: 3,
                px: 4,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#0F4C5C', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🛍️ Marketplace
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 280 }}>
                Your one-stop destination for quality products
                from verified vendors across India.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Shop</Typography>
              {['Electronics', 'Clothing', 'Home & Kitchen', 'Fitness'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ opacity: 0.7, mb: 0.5, cursor: 'pointer', '&:hover': { opacity: 1 } }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Account</Typography>
              {['Login', 'Sign Up', 'Orders', 'Profile'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ opacity: 0.7, mb: 0.5, cursor: 'pointer', '&:hover': { opacity: 1 } }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Sell</Typography>
              {['Become a Vendor', 'Vendor Dashboard', 'Pricing', 'Support'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ opacity: 0.7, mb: 0.5, cursor: 'pointer', '&:hover': { opacity: 1 } }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Help</Typography>
              {['FAQ', 'Returns', 'Shipping', 'Contact Us'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ opacity: 0.7, mb: 0.5, cursor: 'pointer', '&:hover': { opacity: 1 } }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
          </Grid>

          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              mt: 4,
              pt: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2026 Marketplace. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={2}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{ opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}