"use client";
// Path: app/dashboard/theme-shell.tsx | Type: NEW

import { usePathname } from "next/navigation";

const knownRoles = new Set(["king", "merchant", "wizard", "prior"]);

export default function ThemeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[2];
  const role = knownRoles.has(segment) ? segment : "king";

  return (
    <div className="dashboard-shell" data-role={role}>
      {children}
    </div>
  );
}
