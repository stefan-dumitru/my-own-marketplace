import type { OrderDetail as OrderDetailType } from "@stefanmarket/shared";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/lib/api";

export function OrderDetail() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiFetch<{ order: OrderDetailType }>(`/buyer/orders/${id}`),
  });

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm underline">
          Back to orders
        </Link>
      </main>
    );
  }

  const { order } = data;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/orders" className="text-sm text-muted-foreground underline">
        ← Back to orders
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Order {order.id.slice(-8)}</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm capitalize text-secondary-foreground">
          {order.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {new Date(order.placedAt).toLocaleString()}
      </p>

      <ul className="mt-6 divide-y divide-border rounded-md border border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.productImageUrlSnapshot && (
                <img
                  src={item.productImageUrlSnapshot}
                  alt={item.productTitleSnapshot}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.productTitleSnapshot}</p>
              <p className="text-sm text-muted-foreground">
                Qty {item.quantity} · {item.unitPriceSnapshot} {order.currency} each
              </p>
            </div>
            <span className="text-sm capitalize text-muted-foreground">
              {item.fulfillmentStatus.replace("_", " ")}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Shipping address</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.shippingAddressSnapshot.fullName}, {order.shippingAddressSnapshot.street},{" "}
          {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.county}{" "}
          {order.shippingAddressSnapshot.postalCode}
        </p>
      </div>

      <div className="mt-6 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>
            {order.subtotal} {order.currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {order.shippingTotal} {order.currency}
          </span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>
            {order.total} {order.currency}
          </span>
        </div>
      </div>
    </main>
  );
}
