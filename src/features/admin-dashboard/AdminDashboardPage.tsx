import { useState } from "react";
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
  Alert,
  MenuItem,
  TextField,
} from "@mui/material";
import { useProducts } from "../../hooks/useProducts";
import { useAllOrders, useUpdateOrderStatus } from "../../hooks/useOrders";
import { useAllProfiles, useUpdateVendorStatus } from "../../hooks/useAuth";
import type { Profile } from "../../types/auth.types";
import type { OrderStatus } from "../../types/order.types";

// Status → MUI color mapping
const ORDER_STATUS_COLOR: Record<
  OrderStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  paid: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

const ROLE_COLOR: Record<Profile["role"], "default" | "primary" | "error"> = {
  customer: "default",
  vendor: "primary",
  admin: "error",
};

export default function AdminDashboardPage() {
  const [tab, setTab] = useState(0);

  // ── Data ──────────────────────────────────────────────────────
  const { data: profiles, isLoading: profilesLoading, isError: profilesError,} = useAllProfiles();
  const { data: products, isLoading: productsLoading, isError: productsError,} = useProducts({});
  const { data: orders, isLoading: ordersLoading, isError: ordersError,} = useAllOrders();
  const updateVendorStatus = useUpdateVendorStatus();

  // Derived — computed from profiles, not a separate query
  const pendingVendors = profiles?.filter(
    (p) => p.role === "vendor" && p.vendor_status === "pending",
  );


  return (
    <Container sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Admin dashboard
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab
          label={`Vendor approvals ${pendingVendors?.length ? `(${pendingVendors.length})` : ""}`}
        />
        <Tab label="Users" />
        <Tab label="Products" />
        <Tab label="Orders" />
      </Tabs>

      {/* ── TAB 0: Vendor approvals ─────────────────────────── */}
      {tab === 0 && (
        <>
          {profilesLoading && <CircularProgress />}
          {profilesError && (
            <Alert severity="error">Failed to load profiles.</Alert>
          )}

          {!profilesLoading && pendingVendors?.length === 0 && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No pending vendor applications.
            </Typography>
          )}

          {pendingVendors && pendingVendors.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingVendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.full_name ?? "—"}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell>
                      {new Date(v.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={updateVendorStatus.isPending}
                          onClick={() =>
                            updateVendorStatus.mutate({
                              id: v.id,
                              status: "approved",
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={updateVendorStatus.isPending}
                          onClick={() =>
                            updateVendorStatus.mutate({
                              id: v.id,
                              status: "rejected",
                            })
                          }
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* ── TAB 1: All users ────────────────────────────────── */}
      {tab === 1 && (
        <>
          {profilesLoading && <CircularProgress />}
          {profilesError && (
            <Alert severity="error">Failed to load users.</Alert>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Vendor status</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name ?? "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.role}
                      color={ROLE_COLOR[p.role as Profile["role"]] ?? "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {p.vendor_status ? (
                      <Chip
                        size="small"
                        label={p.vendor_status}
                        color={
                          p.vendor_status === "approved"
                            ? "success"
                            : p.vendor_status === "rejected"
                              ? "error"
                              : "warning"
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* ── TAB 2: Products ─────────────────────────────────── */}
      {tab === 2 && (
        <>
          {productsLoading && <CircularProgress />}
          {productsError && (
            <Alert severity="error">Failed to load products.</Alert>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>₹{p.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.status}
                      color={
                        p.status === "active"
                          ? "success"
                          : p.status === "draft"
                            ? "warning"
                            : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* ── TAB 3: Orders ───────────────────────────────────── */}
      {tab === 3 && (
        <>
          {ordersLoading && <CircularProgress />}
          {ordersError && (
            <Alert severity="error">Failed to load orders.</Alert>
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders?.map((o) => (
                <TableRow key={o.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    #{o.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    ₹{o.total_amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    {o.status}
                  </TableCell>
                  <TableCell>
                    {new Date(o.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Container>
  );
}
