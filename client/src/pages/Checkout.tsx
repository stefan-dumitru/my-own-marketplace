import { zodResolver } from "@hookform/resolvers/zod";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  createAddressSchema,
  type AddressView,
  type CartView,
  type CreateAddressInput,
} from "@stefanmarket/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { stripePromise } from "@/lib/stripe";

function AddressForm({ onCreated }: { onCreated: (address: AddressView) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAddressInput>({ resolver: zodResolver(createAddressSchema) });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: CreateAddressInput) {
    setError(null);
    try {
      const res = await apiFetch<{ address: AddressView }>("/buyer/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      });
      onCreated(res.address);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <form className="space-y-3 rounded-md border border-border p-4" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-sm font-medium">Add a shipping address</h2>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Full name" className="rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("fullName")} />
        <input placeholder="Phone" className="rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("phone")} />
        <input placeholder="Street" className="col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("street")} />
        <input placeholder="City" className="rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("city")} />
        <input placeholder="County" className="rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("county")} />
        <input placeholder="Postal code" className="rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("postalCode")} />
      </div>
      {Object.values(errors)[0] && (
        <p className="text-sm text-destructive">{Object.values(errors)[0]?.message}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Save address
      </Button>
    </form>
  );
}

function PaymentStep({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setIsPaying(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/orders/${orderId}` },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setIsPaying(false);
      return;
    }

    navigate(`/orders/${orderId}`, { replace: true });
  }

  return (
    <div className="mt-6 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handlePay} disabled={!stripe || isPaying} className="w-full">
        {isPaying ? "Processing…" : "Pay now"}
      </Button>
    </div>
  );
}

export function Checkout() {
  const [addresses, setAddresses] = useState<AddressView[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartView | null>(null);
  const [checkoutState, setCheckoutState] = useState<{ orderId: string; clientSecret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStartingPayment, setIsStartingPayment] = useState(false);

  useEffect(() => {
    apiFetch<{ addresses: AddressView[] }>("/buyer/addresses").then((res) => {
      setAddresses(res.addresses);
      setSelectedAddressId(res.addresses.find((a) => a.isDefault)?.id ?? res.addresses[0]?.id ?? null);
    });
    apiFetch<CartView>("/buyer/cart").then(setCart);
  }, []);

  async function startPayment() {
    if (!selectedAddressId) return;
    setError(null);
    setIsStartingPayment(true);
    try {
      const res = await apiFetch<{ orderId: string; clientSecret: string }>("/buyer/checkout", {
        method: "POST",
        body: JSON.stringify({ addressId: selectedAddressId }),
      });
      setCheckoutState(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsStartingPayment(false);
    }
  }

  if (cart && cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link to="/products" className="mt-4 inline-block text-sm underline">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

      {cart && (
        <p className="mt-2 text-sm text-muted-foreground">
          Subtotal: {cart.subtotal} {cart.currency}
        </p>
      )}

      {!checkoutState && (
        <div className="mt-6 space-y-4">
          {addresses && addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1"
                  />
                  <span>
                    {address.fullName}, {address.street}, {address.city}, {address.county}{" "}
                    {address.postalCode}
                  </span>
                </label>
              ))}
            </div>
          )}

          {(!addresses || addresses.length === 0) && (
            <AddressForm
              onCreated={(address) => {
                setAddresses((prev) => [...(prev ?? []), address]);
                setSelectedAddressId(address.id);
              }}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={startPayment} disabled={!selectedAddressId || isStartingPayment} className="w-full">
            Continue to payment
          </Button>
        </div>
      )}

      {checkoutState && (
        <Elements stripe={stripePromise} options={{ clientSecret: checkoutState.clientSecret }}>
          <PaymentStep orderId={checkoutState.orderId} />
        </Elements>
      )}
    </main>
  );
}
