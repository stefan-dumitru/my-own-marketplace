import { useAuthStore } from "@/store/auth.store";

// Called once on app mount. The access token only ever lives in memory (never
// localStorage), so a page reload has to recover it via the httpOnly refresh cookie.
export async function bootstrapSession() {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!res.ok) {
      useAuthStore.getState().clearSession();
      return;
    }
    const data = await res.json();
    useAuthStore.getState().setSession({ user: data.user, accessToken: data.accessToken });
  } catch {
    useAuthStore.getState().clearSession();
  }
}
