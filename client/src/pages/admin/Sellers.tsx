import type { SellerAdminView, SellerStatus } from "@stefanmarket/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const STATUS_OPTIONS: SellerStatus[] = ["pending", "approved", "suspended", "rejected"];

export function Sellers() {
  const [status, setStatus] = useState<SellerStatus>("pending");
  const [reasonRowId, setReasonRowId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sellers", status],
    queryFn: () =>
      apiFetch<{ sellers: SellerAdminView[]; total: number }>(`/admin/sellers?status=${status}`),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
  }

  async function approve(id: string) {
    await apiFetch(`/admin/sellers/${id}/approve`, { method: "POST" });
    invalidate();
  }

  async function submitReason(id: string, action: "reject" | "suspend") {
    if (!reasonText.trim()) return;
    await apiFetch(`/admin/sellers/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason: reasonText }),
    });
    setReasonRowId(null);
    setReasonText("");
    invalidate();
  }

  return (
    <div>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={status === option ? "default" : "outline"}
            onClick={() => setStatus(option)}
            className="capitalize"
          >
            {option}
          </Button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      {data && data.sellers.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No {status} sellers.</p>
      )}

      <ul className="mt-6 space-y-3">
        {data?.sellers.map((seller) => (
          <li key={seller.id} className="rounded-md border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{seller.companyName}</p>
                <p className="text-sm text-muted-foreground">
                  {seller.user.name} · {seller.user.email}
                </p>
                <p className="text-sm text-muted-foreground">Reg. no. {seller.registrationNumber}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => approve(seller.id)}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReasonRowId(reasonRowId === seller.id ? null : seller.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {status === "approved" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setReasonRowId(reasonRowId === seller.id ? null : seller.id)}
                  >
                    Suspend
                  </Button>
                )}
              </div>
            </div>

            {reasonRowId === seller.id && (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reason (required)"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!reasonText.trim()}
                  onClick={() => submitReason(seller.id, status === "pending" ? "reject" : "suspend")}
                >
                  Confirm
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
