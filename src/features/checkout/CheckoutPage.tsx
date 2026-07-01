import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Alert, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { usePlaceOrder } from '../../api/orders';
import { clearCart } from '../../store/cartSlice';

const schema = z.object({
  line1: z.string().min(3, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  postalCode: z.string().min(3, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const userId = useAppSelector((state) => state.auth.userId);
  const placeOrder = usePlaceOrder();
  const [orderError, setOrderError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const onSubmit = async (address: FormData) => {
    if (!userId) return;
    setOrderError(null);
    try {
      await placeOrder.mutateAsync({ customerId: userId, items, shippingAddress: address });
      dispatch(clearCart());
      navigate('/orders');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Could not place order');
    }
  };

  if (items.length === 0) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography variant="h5">Your cart is empty.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/')}>
          Continue shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 8 }}>
      <Typography variant="h4" gutterBottom>Checkout</Typography>
      {orderError && <Alert severity="error" sx={{ mb: 2 }}>{orderError}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Shipping address</Typography>
        <TextField
          fullWidth
          label="Street address"
          margin="normal"
          {...register('line1')}
          error={!!errors.line1}
          helperText={errors.line1?.message}
        />
        <TextField
          fullWidth
          label="City"
          margin="normal"
          {...register('city')}
          error={!!errors.city}
          helperText={errors.city?.message}
        />
        <TextField
          fullWidth
          label="State"
          margin="normal"
          {...register('state')}
          error={!!errors.state}
          helperText={errors.state?.message}
        />
        <TextField
          fullWidth
          label="Postal code"
          margin="normal"
          {...register('postalCode')}
          error={!!errors.postalCode}
          helperText={errors.postalCode?.message}
        />

        <Divider sx={{ my: 3 }} />
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6">${total.toFixed(2)}</Typography>
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={placeOrder.isPending}
        >
          {placeOrder.isPending ? 'Placing order…' : 'Place order'}
        </Button>
      </Box>
    </Container>
  );
}
