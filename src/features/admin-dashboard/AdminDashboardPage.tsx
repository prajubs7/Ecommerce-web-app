import { useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Button,
  Box,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { useProducts } from '../../api/products';
import { useAllOrders } from '../../api/orders';
import type { Profile } from '../../types/database.types';

function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

function useApproveVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('profiles').update({ vendor_status: status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState(0);
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const { data: products, isLoading: productsLoading } = useProducts({});
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const approveVendor = useApproveVendor();

  const pendingVendors = profiles?.filter((p) => p.role === 'vendor' && p.vendor_status === 'pending');

  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>Admin dashboard</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Vendor approvals" />
        <Tab label="Users" />
        <Tab label="Products" />
        <Tab label="Orders" />
      </Tabs>

      {tab === 0 && (
        <>
          {profilesLoading && <CircularProgress />}
          {pendingVendors?.length === 0 && (
            <Typography color="text.secondary">No pending vendor applications.</Typography>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingVendors?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.full_name}</TableCell>
                  <TableCell>{v.email}</TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => approveVendor.mutate({ id: v.id, status: 'approved' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => approveVendor.mutate({ id: v.id, status: 'rejected' })}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {tab === 1 && (
        <>
          {profilesLoading && <CircularProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell><Chip size="small" label={p.role} /></TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {tab === 2 && (
        <>
          {productsLoading && <CircularProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>${p.price.toFixed(2)}</TableCell>
                  <TableCell><Chip size="small" label={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {tab === 3 && (
        <>
          {ordersLoading && <CircularProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders?.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>#{o.id.slice(0, 8)}</TableCell>
                  <TableCell>${o.total_amount.toFixed(2)}</TableCell>
                  <TableCell><Chip size="small" label={o.status} /></TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Container>
  );
}
