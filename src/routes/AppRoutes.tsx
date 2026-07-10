import { lazy, Suspense }      from 'react';
import { Routes, Route }       from 'react-router-dom';
import Navbar                  from '../components/Navbar';
import CartDrawer              from '../features/cart/CartDrawer';
import { ProtectedRoute }      from './ProtectedRoute';
import {
  PageLoader,
  ProductGridSkeleton,
  DashboardSkeleton,
  AuthSkeleton,
} from '../components/PageLoader';


// ── Public pages ──────────────────────────────────────────────
const HomePage = lazy(
  () => import('../features/home/HomePage')
);
const ProductListPage = lazy(
  () => import('../features/products/ProductListPage')
);
const ProductDetailPage = lazy(
  () => import('../features/products/ProductDetailPage')
);

// ── Auth pages ────────────────────────────────────────────────
const LoginPage = lazy(
  () => import('../features/auth/LoginPage')
);
const SignupPage = lazy(
  () => import('../features/auth/SignupPage')
);

// ── Customer pages ────────────────────────────────────────────
const CheckoutPage = lazy(
  () => import('../features/checkout/CheckoutPage')
);
const OrderHistoryPage = lazy(
  () => import('../features/checkout/OrderHistoryPage')
);

// ── Vendor pages ──────────────────────────────────────────────
const VendorDashboardPage = lazy(
  () => import('../features/vendor-dashboard/VendorDashboardPage')
);
const VendorPendingPage = lazy(
  () => import('../features/vendor-dashboard/VendorPendingPage')
);

const AdminDashboardPage = lazy(
  () => import('../features/admin-dashboard/AdminDashboardPage')
);

const WishlistPage = lazy(
  () => import('../features/wishlist/WishlistPage')
);

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Public routes ──────────────────────────── */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            }
          />

          <Route
            path="/products"
            element={
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductListPage />
              </Suspense>
            }
          />

          <Route
            path="/products/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductDetailPage />
              </Suspense>
            }
          />

          {/* ── Auth routes ────────────────────────────── */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<AuthSkeleton />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/signup"
            element={
              <Suspense fallback={<AuthSkeleton />}>
                <SignupPage />
              </Suspense>
            }
          />

          <Route
            path="/vendor/pending"
            element={
              <Suspense fallback={<PageLoader />}>
                <VendorPendingPage />
              </Suspense>
            }
          />

          {/* ── Protected: any logged-in user ──────────── */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CheckoutPage />
                </Suspense>
              }
            />
            <Route
              path="/orders"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <OrderHistoryPage />
                </Suspense>
              }
            />
            <Route
              path="/wishlist"
              element={
                <Suspense fallback={<ProductGridSkeleton />}>
                  <WishlistPage />
                </Suspense>
              }
            />
          </Route>

          {/* ── Protected: vendor only ─────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
            <Route
              path="/vendor"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <VendorDashboardPage />
                </Suspense>
              }
            />
          </Route>

          {/* ── Protected: admin only ──────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route
              path="/admin"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <AdminDashboardPage />
                </Suspense>
              }
            />
          </Route>

        </Routes>
      </Suspense>
    </>
  );
}