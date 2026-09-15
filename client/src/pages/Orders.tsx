import type { OrderSummary } from "@stefanmarket/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { apiFetch } from "@/lib/api";

export function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch<{ orders: OrderSummary[] }>("/buyer/orders"),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your orders</h1>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      {data && data.orders.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
      )}

      <ul className="mt-6 space-y-3">
        {data?.orders.map((order) => (
          <li key={order.id}>
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-md border border-border p-4 hover:border-primary"
            >
              <div>
                <p className="text-sm font-medium">Order {order.id.slice(-8)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.placedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {order.total} {order.currency}
                </p>
                <p className="text-sm capitalize text-muted-foreground">{order.status.replace("_", " ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
