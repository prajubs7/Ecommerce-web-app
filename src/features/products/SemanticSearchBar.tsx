import { useState } from 'react';
import {
  Box, TextField, InputAdornment, CircularProgress,
  Typography, Paper, List, ListItemButton, ListItemText,
  Chip, Divider, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';


export default function SemanticSearchBar() {
  const navigate          = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  // Only show dropdown results — separate from ProductListPage search
  const {
    results,
    isLoading,
    isError,
    isSemantic,
    query: searchedQuery,
  } = useSemanticSearch(query);

  const showDropdown = focused && query.length >= 2;
  const isTyping     = query !== searchedQuery;

  const handleSelect = (productId: string) => {
    navigate(`/products/${productId}`);
    setQuery('');
    setFocused(false);
  };

  const handleViewAll = () => {
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setFocused(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 560 }}>
      <TextField
        fullWidth
        placeholder="Search or describe what you need…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isSemantic
                ? <AutoAwesome sx={{ color: 'secondary.main', fontSize: 18 }} />
                : <SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
              }
            </InputAdornment>
          ),
          endAdornment: (isLoading || isTyping) && query ? (
            <InputAdornment position="end">
              <CircularProgress size={14} />
            </InputAdornment>
          ) : null,
          sx: { borderRadius: 3, bgcolor: 'background.paper' },
        }}
      />

      {/* Search hint */}
      {query.length >= 2 && query.length < 4 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'absolute', top: '100%', left: 0, mt: 0.5 }}
        >
          💡 Type 4+ words for AI-powered semantic search
        </Typography>
      )}

      {/* Results dropdown */}
      {showDropdown && searchedQuery.length >= 2 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0, right: 0,
            zIndex: 1300,
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {/* Method indicator */}
          <Box
            sx={{
              px: 2, py: 1,
              bgcolor: isSemantic ? 'secondary.light' : 'grey.100',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isSemantic ? (
              <>
                <AutoAwesome sx={{ fontSize: 14, color: 'secondary.dark' }} />
                <Typography variant="caption" fontWeight={700} color="secondary.dark">
                  AI Semantic Search — understanding your intent
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Keyword search
              </Typography>
            )}
          </Box>

          {isError && (
            <Alert severity="warning" sx={{ m: 1 }}>
              Search unavailable — showing keyword results
            </Alert>
          )}

          {!isLoading && results.length === 0 && searchedQuery && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                No products found for "{searchedQuery}"
              </Typography>
            </Box>
          )}

          <List disablePadding>
            {results.slice(0, 6).map(({ product, similarity }) => (
              <ListItemButton
                key={product.id}
                onClick={() => handleSelect(product.id)}
                sx={{ py: 1.5, px: 2 }}
              >
                {/* Product thumbnail */}
                <Box
                  component="img"
                  src={product.images?.[0] ?? `https://picsum.photos/seed/${product.id}/60/60`}
                  alt={product.title}
                  sx={{
                    width: 48, height: 48,
                    borderRadius: 1,
                    objectFit: 'cover',
                    mr: 2, flexShrink: 0,
                  }}
                />

                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {product.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      ₹{product.price.toLocaleString('en-IN')}
                    </Typography>
                  }
                />

                {/* Similarity score (dev only, remove in prod) */}
                {isSemantic && import.meta.env.DEV && (
                  <Chip
                    label={`${Math.round(similarity * 100)}%`}
                    size="small"
                    color={similarity > 0.7 ? 'success' : similarity > 0.5 ? 'warning' : 'default'}
                    sx={{ ml: 1, fontSize: 10 }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>

          {results.length > 0 && (
            <>
              <Divider />
              <ListItemButton onClick={handleViewAll} sx={{ py: 1.5, justifyContent: 'center' }}>
                <Typography variant="body2" color="primary" fontWeight={600}>
                  View all results for "{searchedQuery}" →
                </Typography>
              </ListItemButton>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}