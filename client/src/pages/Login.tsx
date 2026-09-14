import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  mfaLoginVerifySchema,
  type AuthUser,
  type LoginInput,
  type MfaLoginVerifyInput,
} from "@stefanmarket/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/account";

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const mfaForm = useForm<MfaLoginVerifyInput>({ resolver: zodResolver(mfaLoginVerifySchema) });

  async function onLogin(data: LoginInput) {
    setError(null);
    try {
      const result = await apiFetch<
        { mfaRequired: true; mfaToken: string } | { mfaRequired?: false; accessToken: string; user: AuthUser }
      >("/auth/login", { method: "POST", body: JSON.stringify(data) });

      if (result.mfaRequired) {
        setMfaToken(result.mfaToken);
        mfaForm.setValue("mfaToken", result.mfaToken);
        return;
      }
      setSession({ user: result.user, accessToken: result.accessToken });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function onMfaVerify(data: MfaLoginVerifyInput) {
    setError(null);
    try {
      const result = await apiFetch<{ accessToken: string; user: AuthUser }>(
        "/auth/mfa/login-verify",
        { method: "POST", body: JSON.stringify(data) },
      );
      setSession({ user: result.user, accessToken: result.accessToken });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (mfaToken) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open your authenticator app and enter the 6-digit code.
        </p>
        <form className="mt-6 space-y-4" onSubmit={mfaForm.handleSubmit(onMfaVerify)}>
          <input type="hidden" {...mfaForm.register("mfaToken")} />
          <div>
            <label className="text-sm font-medium" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest"
              maxLength={6}
              autoFocus
              {...mfaForm.register("code")}
            />
            {mfaForm.formState.errors.code && (
              <p className="mt-1 text-sm text-destructive">{mfaForm.formState.errors.code.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={mfaForm.formState.isSubmitting}>
            Verify
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...loginForm.register("email")}
          />
          {loginForm.formState.errors.email && (
            <p className="mt-1 text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...loginForm.register("password")}
          />
          {loginForm.formState.errors.password && (
            <p className="mt-1 text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
          Log in
        </Button>
      </form>
      <a href="/api/auth/google" className="mt-3 block text-center text-sm text-muted-foreground underline">
        Continue with Google
      </a>
      <p className="mt-6 text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </main>
  );
}
