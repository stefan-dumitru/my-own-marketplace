import type { CartView } from "@stefanmarket/shared";
import { useQuery } from "@tanstack/react-query";
import { Moon, ShoppingCart, Sun } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useAuthStore } from "@/store/auth.store";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, status } = useAuthStore();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartView>("/buyer/cart"),
    enabled: user?.role === "buyer",
  });
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          stefanmarket
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/products" className="text-muted-foreground hover:text-foreground">
            Shop
          </Link>
          {user?.role === "buyer" && (
            <>
              <Link to="/orders" className="text-muted-foreground hover:text-foreground">
                Orders
              </Link>
              <Link
                to="/cart"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && <span>{cartCount}</span>}
              </Link>
            </>
          )}
          {user?.role === "seller" && (
            <Link to="/seller/products" className="text-muted-foreground hover:text-foreground">
              Sell
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
          {status === "authenticated" && user ? (
            <Link to="/account" className="text-muted-foreground hover:text-foreground">
              Account
            </Link>
          ) : (
            status !== "loading" && (
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Log in
              </Link>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
