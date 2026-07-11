import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Drawer,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import type { OrderStatus } from '../../types/database.types';
import { Close } from '@mui/icons-material';
import { useCustomerOrders } from '../../hooks/useOrders';
import type { OrderWithItems } from '../../types/order.types';

const statusColor: Record<OrderStatus, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
  pending: 'warning',
  paid: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrderHistoryPage() {
  const userId = useAppSelector((state) => state.auth.userId);
  const { data: orders, isLoading, isError, error } = useCustomerOrders(userId ?? undefined);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  console.log('Fetched orders:', orders, isLoading, isError, error);
  console.log('Selected order:', selectedOrder);
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

      {orders?.map((order : OrderWithItems) => (
        <Card key={order.id} sx={{ mb: 2 }}>
          <CardActionArea onClick={() => setSelectedOrder(order.order_items[0]?.products)}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Order #{order.order_items[0]?.products?.title}</Typography>
                <Chip label={order.status} color={statusColor[order.status as OrderStatus]} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {new Date(order.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>${order.total_amount.toFixed(2)}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}

      <Drawer
        anchor="right"
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        {selectedOrder && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Order #{selectedOrder.title}</Typography>
              <IconButton onClick={() => setSelectedOrder(null)}>
                <Close />
              </IconButton>
            </Box>

            <Chip
              label={selectedOrder.status}
              color={statusColor[selectedOrder.status as OrderStatus]}
              size="small"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary">
              Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
            </Typography>

            <Divider sx={{ my: 2 }} />


            {/* Line items — adjust field names to match your actual query shape */}
            {selectedOrder ? (
              <Stack spacing={1.5} sx={{ mb: 2 }}>
               
                  <Box key={selectedOrder.id} display="flex" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2">{selectedOrder.title ?? 'Product'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {selectedOrder.quantity ?? 1}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      ${(selectedOrder.price ).toFixed(2)}
                    </Typography>
                  </Box>
               
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No item details available.
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1">${selectedOrder.price.toFixed(2)}</Typography>
            </Box>
          </>
        )}
      </Drawer>
    </Container>
  );
}