import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import ShopLayout from "@/layouts/ShopLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import RoleRoute from "@/routes/RoleRoute";

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

import PaymentPage from "@/pages/shop/PaymentPage";

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
import AdminTablesPage from "@/pages/admin/AdminTablesPage";
import AdminBillingPage from "@/pages/admin/AdminBillingPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";

// POS & Kitchen pages
import PosTerminalPage from "@/pages/pos/PosTerminalPage";
import KitchenDisplayPage from "@/pages/kitchen/KitchenDisplayPage";

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
            <Route path="/payment/:id" element={<PaymentPage />} />
            <Route path="/order/:orderNumber" element={<OrderTrackingPage />} />
            <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
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

          {/* POS Terminal (Waiters, Cashiers, Admins) */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["WAITER", "CASHIER"]}
                title="Dine-In POS Terminal"
                description="Access to Dine-In Table Ordering and POS is restricted to Waiters, Cashiers, and Management."
              />
            }
          >
            <Route path="/pos" element={<PosTerminalPage />} />
          </Route>

          {/* Kitchen KDS Screen (Chef, Kitchen Staff, Admins only) */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["KITCHEN", "CHEF"]}
                title="Kitchen Display Screen (KDS)"
                description="Access to the Kitchen Display Screen (KDS) is strictly restricted to Chef and Kitchen staff."
              />
            }
          >
            <Route path="/kitchen" element={<KitchenDisplayPage />} />
          </Route>

          {/* Standalone Cashier & Waiter Billing Screen */}
          <Route
            element={
              <RoleRoute
                allowedRoles={["WAITER", "CASHIER"]}
                title="Cashier & Table Billing"
                description="Access to Table Settlements and Cashier Billing is restricted to Waiters, Cashiers, and Management."
              />
            }
          >
            <Route path="/billing" element={<AdminBillingPage />} />
          </Route>

          {/* Admin Public Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/tables" element={<AdminTablesPage />} />
              <Route path="/admin/billing" element={<AdminBillingPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
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
