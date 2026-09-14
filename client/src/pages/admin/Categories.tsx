import type { CategoryView } from "@stefanmarket/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function buildTree(categories: CategoryView[], parentId: string | null = null, depth = 0): { category: CategoryView; depth: number }[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) => [{ category, depth }, ...buildTree(categories, category.id, depth + 1)]);
}

export function Categories() {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiFetch<{ categories: CategoryView[] }>("/admin/categories"),
  });

  const categories = data?.categories ?? [];
  const rows = buildTree(categories);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  }

  async function createCategory() {
    if (!name.trim()) return;
    await apiFetch("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, parentId: parentId || null }),
    });
    setName("");
    setParentId("");
    invalidate();
  }

  async function toggleActive(category: CategoryView) {
    await apiFetch(`/admin/categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    invalidate();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">No parent (top-level)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button onClick={createCategory} disabled={!name.trim()}>
          Add category
        </Button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      <ul className="mt-6 divide-y divide-border rounded-md border border-border">
        {rows.map(({ category, depth }) => (
          <li key={category.id} className="flex items-center justify-between gap-4 px-4 py-2">
            <span
              className={cn("text-sm", !category.isActive && "text-muted-foreground line-through")}
              style={{ paddingLeft: depth * 20 }}
            >
              {category.name}
            </span>
            <Button size="sm" variant="outline" onClick={() => toggleActive(category)}>
              {category.isActive ? "Archive" : "Restore"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
