import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { bootstrapSession } from "@/lib/session";
import { Account } from "@/pages/Account";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { Categories } from "@/pages/admin/Categories";
import { Sellers } from "@/pages/admin/Sellers";
import { Cart } from "@/pages/Cart";
import { Catalog } from "@/pages/Catalog";
import { Checkout } from "@/pages/Checkout";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { MfaSetup } from "@/pages/MfaSetup";
import { OrderDetail } from "@/pages/OrderDetail";
import { Orders } from "@/pages/Orders";
import { ProductDetail } from "@/pages/ProductDetail";
import { Register } from "@/pages/Register";
import { ProductForm } from "@/pages/seller/ProductForm";
import { Products } from "@/pages/seller/Products";
import { SellerLayout } from "@/pages/seller/SellerLayout";

export function App() {
  useEffect(() => {
    void bootstrapSession();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Catalog />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mfa-setup"
          element={
            <ProtectedRoute roles={["admin", "support"]}>
              <MfaSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute roles={["buyer"]}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={["buyer"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={["buyer"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute roles={["buyer"]}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="sellers" replace />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="categories" element={<Categories />} />
        </Route>
        <Route
          path="/seller"
          element={
            <ProtectedRoute roles={["seller"]}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
        </Route>
      </Routes>
    </div>
  );
}
