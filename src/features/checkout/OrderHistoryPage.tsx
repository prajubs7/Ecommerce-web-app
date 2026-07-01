import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { useCustomerOrders } from '../../api/orders';
import type { OrderStatus } from '../../types/database.types';

const statusColor: Record<OrderStatus, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
  pending: 'warning',
  paid: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrderHistoryPage() {
  const userId = useAppSelector((state) => state.auth.userId);
  const { data: orders, isLoading, isError } = useCustomerOrders(userId ?? undefined);

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>Your orders</Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      )}
      {isError && <Alert severity="error">Couldn't load your orders.</Alert>}
      {!isLoading && orders?.length === 0 && (
        <Typography color="text.secondary">You haven't placed any orders yet.</Typography>
      )}

      {orders?.map((order) => (
        <Card key={order.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Order #{order.id.slice(0, 8)}</Typography>
              <Chip label={order.status} color={statusColor[order.status as OrderStatus]} size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>${order.total_amount.toFixed(2)}</Typography>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}
