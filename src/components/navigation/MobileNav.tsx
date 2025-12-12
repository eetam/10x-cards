import { useState } from "react";
import { Menu, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NavLink } from "./NavLink";
import { useAuth } from "../../lib/hooks/useAuth";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/flashcards", label: "Moje fiszki" },
  { href: "/generate", label: "Generuj" },
  { href: "/study", label: "Ucz się" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavClick = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      // Redirect to login page after successful logout
      // Using replace to prevent back button from returning to protected page
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="md:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Otwórz menu">
            <Menu />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {/* User info if authenticated */}
          {!isLoading && isAuthenticated && user && (
            <div className="border-b pb-4 mb-4">
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          )}

          {/* Navigation links - only show for authenticated users */}
          {isAuthenticated && (
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  className="w-full justify-start py-3"
                  onClick={handleNavClick}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Auth section */}
          {!isLoading && (
            <div className="border-t pt-4 mt-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/settings" onClick={handleNavClick}>
                      <Settings className="mr-2 size-4" />
                      Ustawienia
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 size-4" />
                    {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/login" onClick={handleNavClick}>
                      Zaloguj się
                    </a>
                  </Button>
                  <Button className="w-full" asChild>
                    <a href="/register" onClick={handleNavClick}>
                      Zarejestruj się
                    </a>
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
