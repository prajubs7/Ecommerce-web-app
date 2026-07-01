import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CartDrawer from '../features/cart/CartDrawer';
import ProductListPage from '../features/products/ProductListPage';
import ProductDetailPage from '../features/products/ProductDetailPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import OrderHistoryPage from '../features/checkout/OrderHistoryPage';
import VendorDashboardPage from '../features/vendor-dashboard/VendorDashboardPage';
import VendorPendingPage from '../features/vendor-dashboard/VendorPendingPage';
import AdminDashboardPage from '../features/admin-dashboard/AdminDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '../features/home/HomePage';

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <Routes>
        {/* Public */}
        {/* <Route path="/" element={<ProductListPage />} /> */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />  
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/vendor/pending" element={<VendorPendingPage />} />

        {/* Any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
        </Route>

        {/* Vendor only */}
        <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
          <Route path="/vendor" element={<VendorDashboardPage />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </>
  );
}
