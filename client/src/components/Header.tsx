import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuthStore } from "@/store/auth.store";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, status } = useAuthStore();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          stefanmarket
        </Link>
        <div className="flex items-center gap-4 text-sm">
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
