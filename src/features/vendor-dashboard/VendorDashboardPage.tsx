import { useState } from "react";
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { Edit as EditOutlineIcon } from "@mui/icons-material";
import { DeleteOutline as DeleteOutlineIcon } from "@mui/icons-material";
import {
  useDeleteProduct,
  //useProducts,
  useVendorProducts,
} from "../../hooks/useProducts";
import { useUpdateOrderStatus, useVendorOrders } from "../../hooks/useOrders";
import { useAuth } from "../../hooks/useAuth";
import ProductFormDialog from "./ProductFormDialog";
import type { OrderStatus, Product } from "../../types/database.types";


const NEXT_STATUS: Record<string, OrderStatus | null> = {
  pending: 'pending',       
  paid: 'paid',         
  shipped: 'shipped',      
  delivered: 'delivered',
  cancelled: 'cancelled',
};

const ORDER_STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  paid: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

export default function VendorDashboardPage() {
  const [tab, setTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { profile } = useAuth();
  const vendorId = profile?.id;

  const { data: products, isLoading: productsLoading } = useVendorProducts({
    vendorId,
  });
  const { data: orderItems, isError: ordersError, error: ordersErrorMessage, isLoading: ordersLoading } =
    useVendorOrders(vendorId);
  const deleteProduct = useDeleteProduct();

  console.log("VendorDashboardPage:  orderItems", { orderItems, ordersError, ordersErrorMessage }, vendorId);
  console.log("orderItems:", JSON.stringify(orderItems, null, 2));
  console.log("VendorDashboardPage:  updateOrderStatus", {
    useUpdateOrderStatus,
  });
  if (profile?.vendor_status === "pending") {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="info">
          Your vendor account is pending approval. You'll be able to list
          products once an admin approves it.
        </Alert>
      </Container>
    );
  }

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this product? This cannot be undone.")) {
      deleteProduct.mutate(id);
    }
  };

  const updateOrderStatus = useUpdateOrderStatus();
  console.log("VendorDashboardPage:  updateOrderStatus", { updateOrderStatus });
  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Vendor dashboard</Typography>
        {tab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateForm}
          >
            Add product
          </Button>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="My products" />
        <Tab label="Orders" />
      </Tabs>

      {tab === 0 && (
        <>
          {productsLoading && <CircularProgress />}
          {products && products.length === 0 && (
            <Typography color="text.secondary">
              You haven't listed any products yet. Click "Add product" to create
              your first listing.
            </Typography>
          )}
          {products && products.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Box
                        component="img"
                        src={
                          p.images?.[0] ??
                          "https://placehold.co/48x48?text=No+Image"
                        }
                        alt={p.title}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          objectFit: "cover",
                        }}
                      />
                    </TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.status}
                        color={p.status === "active" ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          onClick={() => openEditForm(p)}
                        >
                          <EditOutlineIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {tab === 1 && (
  <>
    {ordersLoading && <CircularProgress />}
    {orderItems && orderItems.length === 0 && (
      <Typography color="text.secondary">No orders yet.</Typography>
    )}
    {orderItems && orderItems.length > 0 && (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Unit price</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderItems.map((item: any) => {
            const currentStatus = item.orders?.status;
            const next = NEXT_STATUS[currentStatus];

            return (
              <TableRow key={item.id}>
                <TableCell sx={{ fontFamily: "monospace" }}>
                  #{item.order_id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={currentStatus}
                    disabled={!next || updateOrderStatus.isPending}
                    sx={{ minWidth: 150 }}
                    SelectProps={{ sx: { fontSize: 13 } }}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (newStatus !== currentStatus) {
                        updateOrderStatus.mutate({
                          orderId: item.id,
                          status:newStatus as OrderStatus,
                        });
                      }
                    }}
                  >
                    {
                      Object.values(NEXT_STATUS)
                        .filter((status): status is OrderStatus => status !== null)
                        .map((status) => (
                          <MenuItem key={status} value={status}>
                            <Chip
                              label={status}
                              size="small"
                              color={ORDER_STATUS_COLOR[status] ?? "default"}
                              sx={{ width: "100%" }}
                            />
                          </MenuItem>
                        ))
                    }
                    
                    {/* { NEXT_STATUS && (
                      <MenuItem value={next}>
                        <Chip
                          label={next}
                          size="small"
                          color={ORDER_STATUS_COLOR[next] ?? "default"}
                          sx={{ width: "100%" }}
                        />
                      </MenuItem>
                    )} */}
                  </TextField>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )}
  </>
)}

      {vendorId && (
        <ProductFormDialog
          key={editingProduct?.id ?? "new"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          vendorId={vendorId}
          product={editingProduct}
        />
      )}
    </Container>
  );
}
