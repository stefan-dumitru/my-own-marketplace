import type { Role } from "@stefanmarket/shared";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { status, user } = useAuthStore();
  const location = useLocation();

  if (status === "loading") {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/account" replace />;
  }

  // MFA is mandatory for Admin/Support (specifications/security.md) — force enrollment
  // before letting them reach anything else if they haven't set it up yet.
  const mfaRequiredRole = user.role === "admin" || user.role === "support";
  if (mfaRequiredRole && !user.mfaEnabled && location.pathname !== "/mfa-setup") {
    return <Navigate to="/mfa-setup" replace />;
  }

  return <>{children}</>;
}
