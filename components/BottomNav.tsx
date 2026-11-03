"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

const items = [
  { href: "/", icon: "home", label: "Today" },
  { href: "/history", icon: "cal", label: "History" },
  { href: "/pay", icon: "card", label: "Pay" },
  { href: "/break", icon: "pause", label: "Break" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <div className="nav-wrap">
      <nav className="nav" aria-label="Main">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} className={"nav-item" + (active ? " active" : "")} aria-current={active ? "page" : undefined}>
              <span className="nav-pill"><Icon name={it.icon} size={22} /></span>
              <span className="nav-label">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
