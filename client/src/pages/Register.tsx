import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type AuthUser, type RegisterInput } from "@stefanmarket/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "buyer", email: "", password: "", name: "" },
  });

  function selectRole(next: "buyer" | "seller") {
    setRole(next);
    setValue("role", next);
  }

  async function onSubmit(data: RegisterInput) {
    setError(null);
    try {
      const result = await apiFetch<{ accessToken: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSession({ user: result.user, accessToken: result.accessToken });
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant={role === "buyer" ? "default" : "outline"}
          onClick={() => selectRole("buyer")}
        >
          I'm a buyer
        </Button>
        <Button
          type="button"
          variant={role === "seller" ? "default" : "outline"}
          onClick={() => selectRole("seller")}
        >
          I'm a seller
        </Button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {role === "seller" && (
          <>
            <div>
              <label className="text-sm font-medium" htmlFor="companyName">
                Company name
              </label>
              <input
                id="companyName"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("companyName")}
              />
              {"companyName" in errors && errors.companyName && (
                <p className="mt-1 text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="registrationNumber">
                Registration number (CUI)
              </label>
              <input
                id="registrationNumber"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("registrationNumber")}
              />
              {"registrationNumber" in errors && errors.registrationNumber && (
                <p className="mt-1 text-sm text-destructive">{errors.registrationNumber.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="iban">
                IBAN
              </label>
              <input
                id="iban"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("iban")}
              />
              {"iban" in errors && errors.iban && (
                <p className="mt-1 text-sm text-destructive">{errors.iban.message}</p>
              )}
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
