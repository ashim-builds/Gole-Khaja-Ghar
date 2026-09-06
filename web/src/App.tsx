import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import ShopLayout from "@/layouts/ShopLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

// Shop pages
import HomePage from "@/pages/shop/HomePage";
import ShopPage from "@/pages/shop/ShopPage";
import ProductDetailPage from "@/pages/shop/ProductDetailPage";
import CheckoutPage from "@/pages/shop/CheckoutPage";
import OrderTrackingPage from "@/pages/shop/OrderTrackingPage";
import OrdersPage from "@/pages/shop/OrdersPage";
import OrderDetailPage from "@/pages/shop/OrderDetailPage";
import AccountPage from "@/pages/shop/AccountPage";
import PrivacyPolicyPage from "@/pages/shop/PrivacyPolicyPage";
import TermsPage from "@/pages/shop/TermsPage";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Admin pages
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "@/pages/admin/AdminOrderDetailPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminNewProductPage from "@/pages/admin/AdminNewProductPage";
import AdminEditProductPage from "@/pages/admin/AdminEditProductPage";
import AdminWaitersPage from "@/pages/admin/AdminWaitersPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";

import NotFoundPage from "@/pages/NotFoundPage";
import ScrollToTop from "@/components/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<RootLayout />}>
          {/* Shop / Customer Routes */}
          <Route element={<ShopLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderNumber" element={<OrderTrackingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Customer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>

          {/* Admin Public Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/products/new" element={<AdminNewProductPage />} />
              <Route path="/admin/products/:id/edit" element={<AdminEditProductPage />} />
              <Route path="/admin/waiters" element={<AdminWaitersPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
