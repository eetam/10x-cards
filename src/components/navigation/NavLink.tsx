import { useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavLink({ href, children, className, onClick }: NavLinkProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if current path matches href
    const checkActive = () => {
      const currentPath = window.location.pathname;
      // Exact match for home, otherwise check if path starts with href
      const active = href === "/" ? currentPath === "/" : currentPath.startsWith(href);
      setIsActive(active);
    };

    checkActive();

    // Listen for navigation changes (for SPAs)
    window.addEventListener("popstate", checkActive);
    return () => window.removeEventListener("popstate", checkActive);
  }, [href]);

  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "relative",
        isActive &&
          "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary",
        "hover:text-primary/80",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </a>
  );
}
