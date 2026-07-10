import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import { Close as CloseIcon } from "@mui/icons-material";
import { DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCartDrawerOpen } from '../../store/uiSlice';
import { removeItem, updateQuantity } from '../../store/cartSlice';

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const open = useAppSelector((state) => state.ui.cartDrawerOpen);
  const items = useAppSelector((state) => state.cart.items);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Drawer anchor="right" open={open} onClose={() => dispatch(setCartDrawerOpen(false))}>
      <Box sx={{ width: 380, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Your cart</Typography>
          <IconButton onClick={() => dispatch(setCartDrawerOpen(false))}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {items.length === 0 ? (
          <Typography color="text.secondary">Your cart is empty.</Typography>
        ) : (
          <Stack spacing={2} flexGrow={1} sx={{ overflowY: 'auto' }}>
            {items.map((item) => (
              <Box key={item.productId} display="flex" gap={2}>
                <Box
                  component="img"
                  src={item.image ?? 'https://placehold.co/80x80'}
                  alt={item.title}
                  sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover' }}
                />
                <Box flexGrow={1}>
                  <Typography variant="body2" fontWeight={600} noWrap>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${item.price.toFixed(2)}
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    inputProps={{ min: 1, max: item.maxStock }}
                    sx={{ width: 70, mt: 0.5 }}
                    onChange={(e) =>
                      dispatch(
                        updateQuantity({ productId: item.productId, quantity: Number(e.target.value) })
                      )
                    }
                  />
                </Box>
                <IconButton size="small" onClick={() => dispatch(removeItem(item.productId))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1" fontWeight={700}>${total.toFixed(2)}</Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={items.length === 0}
          onClick={() => {
            dispatch(setCartDrawerOpen(false));
            navigate('/checkout');
          }}
        >
          Checkout
        </Button>
      </Box>
    </Drawer>
  );
}
