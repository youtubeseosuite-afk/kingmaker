// Path: app/dashboard/layout.tsx | Type: UPDATE
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { logout } from "../actions";
import RoleSelector from "./role-selector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: realm } = await supabase
    .from("realms")
    .select("id, name")
    .eq("player_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!realm) {
    redirect("/new-realm");
  }

  return (
    <div className="dashboard-shell">
      <header className="role-nav">
        <div className="role-nav__brand">{realm.name}</div>
        <RoleSelector />
        <div className="role-nav__account">
          <span className="role-nav__email">{user.email}</span>
          <form action={logout}>
            <button className="btn" type="submit">
              Log ud
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
