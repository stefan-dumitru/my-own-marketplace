import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [{ to: "/seller/products", label: "Products" }];

export function SellerLayout() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Seller</h1>
      <nav className="mt-4 flex gap-1 border-b border-border">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </main>
  );
}
