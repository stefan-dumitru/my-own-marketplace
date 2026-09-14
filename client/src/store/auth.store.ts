import type { AuthUser } from "@stefanmarket/shared";
import { create } from "zustand";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  setSession: (session: { user: AuthUser; accessToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
}));
