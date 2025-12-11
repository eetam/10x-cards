import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NavLink } from "./NavLink";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/flashcards", label: "Moje fiszki" },
  { href: "/generate", label: "Generuj" },
  { href: "/study", label: "Ucz się" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const handleNavClick = () => {
    setOpen(false);
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
          <nav className="flex flex-col gap-2 mt-4">
            {navigationItems.map((item) => (
              <NavLink key={item.href} href={item.href} className="w-full justify-start py-3" onClick={handleNavClick}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </div>
  );
}
