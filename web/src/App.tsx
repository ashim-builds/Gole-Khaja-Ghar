import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import ShopLayout from "@/layouts/ShopLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import RoleRoute from "@/routes/RoleRoute";
import ScrollToTop from "@/components/ScrollToTop";

const RouteLoading = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 gap-3">
    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
    <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Loading...</span>
  </div>
);

const HomePage = lazy(() => import("@/pages/shop/HomePage"));
const ShopPage = lazy(() => import("@/pages/shop/ShopPage"));
const ProductDetailPage = lazy(() => import("@/pages/shop/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/shop/CheckoutPage"));
const OrderTrackingPage = lazy(() => import("@/pages/shop/OrderTrackingPage"));
const OrdersPage = lazy(() => import("@/pages/shop/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/shop/OrderDetailPage"));
const AccountPage = lazy(() => import("@/pages/shop/AccountPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/shop/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/shop/TermsPage"));
const PaymentPage = lazy(() => import("@/pages/shop/PaymentPage"));

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));

const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("@/pages/admin/AdminOrderDetailPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminNewProductPage = lazy(() => import("@/pages/admin/AdminNewProductPage"));
const AdminEditProductPage = lazy(() => import("@/pages/admin/AdminEditProductPage"));
const AdminWaitersPage = lazy(() => import("@/pages/admin/AdminWaitersPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminTablesPage = lazy(() => import("@/pages/admin/AdminTablesPage"));
const AdminBillingPage = lazy(() => import("@/pages/admin/AdminBillingPage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));

const PosTerminalPage = lazy(() => import("@/pages/pos/PosTerminalPage"));
const KitchenDisplayPage = lazy(() => import("@/pages/kitchen/KitchenDisplayPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<RootLayout />}>
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

              <Route element={<ProtectedRoute />}>
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>
            </Route>

            <Route element={<RoleRoute allowedRoles={["WAITER", "CASHIER"]} title="Dine-In POS Terminal" description="Access restricted to Waiters and Cashiers." />}>
              <Route path="/pos" element={<PosTerminalPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["KITCHEN", "CHEF"]} title="Kitchen Display Screen" description="Access restricted to Kitchen staff." />}>
              <Route path="/kitchen" element={<KitchenDisplayPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["WAITER", "CASHIER"]} title="Cashier Billing" description="Access restricted to Cashiers." />}>
              <Route path="/billing" element={<AdminBillingPage />} />
            </Route>

            <Route path="/admin/login" element={<AdminLoginPage />} />

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

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}