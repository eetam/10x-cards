import { NavLink } from "./NavLink";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/flashcards", label: "Moje fiszki" },
  { href: "/generate", label: "Generuj" },
  { href: "/study", label: "Ucz się" },
];

export function NavLinks() {
  return (
    <nav className="hidden md:flex gap-1 items-center">
      {navigationItems.map((item) => (
        <NavLink key={item.href} href={item.href}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
