import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function Account() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    clearSession();
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Role</dt>
          <dd className="capitalize">{user.role}</dd>
        </div>
        {user.sellerStatus && (
          <div className="flex gap-2">
            <dt className="w-32 text-muted-foreground">Seller status</dt>
            <dd className="capitalize">{user.sellerStatus}</dd>
          </div>
        )}
        {(user.role === "admin" || user.role === "support") && (
          <div className="flex gap-2">
            <dt className="w-32 text-muted-foreground">MFA</dt>
            <dd>{user.mfaEnabled ? "Enabled" : "Not enabled"}</dd>
          </div>
        )}
      </dl>
      <Button variant="outline" className="mt-8" onClick={handleLogout}>
        Log out
      </Button>
    </main>
  );
}
