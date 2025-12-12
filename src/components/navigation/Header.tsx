import { useAuth } from "../../lib/hooks/useAuth";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { DashboardAuthLinks } from "../dashboard/DashboardAuthLinks";

export function Header() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && <NavLinks />}
          {!isLoading && (isAuthenticated ? <UserMenu /> : <DashboardAuthLinks />)}
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  );
}
