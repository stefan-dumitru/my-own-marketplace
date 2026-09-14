import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { bootstrapSession } from "@/lib/session";
import { Account } from "@/pages/Account";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { Categories } from "@/pages/admin/Categories";
import { Sellers } from "@/pages/admin/Sellers";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { MfaSetup } from "@/pages/MfaSetup";
import { Register } from "@/pages/Register";

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
      </Routes>
    </div>
  );
}
