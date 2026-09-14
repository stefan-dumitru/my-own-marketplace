import { zodResolver } from "@hookform/resolvers/zod";
import { mfaSetupVerifySchema, type AuthUser, type MfaSetupVerifyInput } from "@stefanmarket/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function MfaSetup() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaSetupVerifyInput>({ resolver: zodResolver(mfaSetupVerifySchema) });

  useEffect(() => {
    apiFetch<{ qrCodeDataUrl: string }>("/auth/mfa/setup", { method: "POST" })
      .then((res) => setQrCodeDataUrl(res.qrCodeDataUrl))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong"));
  }, []);

  async function onSubmit(data: MfaSetupVerifyInput) {
    setError(null);
    try {
      await apiFetch("/auth/mfa/verify", { method: "POST", body: JSON.stringify(data) });
      const { user } = await apiFetch<{ user: AuthUser }>("/me");
      setUser(user);
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Incorrect code");
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Set up two-factor authentication</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Required for your role. Scan the code with an authenticator app, then enter the 6-digit
        code it generates.
      </p>

      {qrCodeDataUrl && (
        <img
          src={qrCodeDataUrl}
          alt="MFA enrollment QR code"
          className="mx-auto mt-6 h-48 w-48 rounded-md border border-border"
        />
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest"
            maxLength={6}
            {...register("code")}
          />
          {errors.code && <p className="mt-1 text-sm text-destructive">{errors.code.message}</p>}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting || !qrCodeDataUrl}>
          Verify and continue
        </Button>
      </form>
    </main>
  );
}
