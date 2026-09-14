import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { bootstrapSession } from "@/lib/session";
import { Account } from "@/pages/Account";
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
      </Routes>
    </div>
  );
}
