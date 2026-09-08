"use client";
// Path: app/dashboard/role-selector.tsx | Type: NEW

import Link from "next/link";
import { usePathname } from "next/navigation";

const roles = [
  { slug: "king", label: "Kongen" },
  { slug: "merchant", label: "Købmanden" },
  { slug: "wizard", label: "Troldmanden" },
  { slug: "prior", label: "Prioren" },
] as const;

export default function RoleSelector() {
  const pathname = usePathname();

  return (
    <div className="role-nav__tabs">
      {roles.map((r) => {
        const href = `/dashboard/${r.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={r.slug}
            href={href}
            className={`role-nav__tab${active ? " role-nav__tab--active" : ""}`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
